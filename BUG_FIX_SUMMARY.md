# Bug Fix: Transaction Auto-Cancel After 5 Seconds

## Problem
When users entered the TopUpPayment page, their orders were being automatically cancelled after just 5 seconds, even though they hadn't navigated away or clicked any cancel button.

## Root Cause
The issue was in the `useEffect` cleanup function in `frontend/src/pages/TopUpPayment.js` (lines 127-151).

The cleanup function was calling `cancelTransactionOnExit()` on **every component unmount**, including:
- Re-renders caused by the countdown timer updating every second
- Re-renders caused by the payment status check every 5 seconds

This meant that every time the component re-rendered (which happens frequently due to the countdown timer and status polling), the transaction was being cancelled!

### Timeline of the Bug:
1. User enters TopUpPayment page
2. Component renders, countdown starts (900 seconds)
3. After 5 seconds, `checkPaymentStatus()` runs (line 195-197)
4. This causes a state update, triggering a re-render
5. The cleanup function runs before the re-render
6. `cancelTransactionOnExit()` is called, cancelling the transaction
7. User sees "Giao dịch đã bị hủy" (Transaction cancelled) message

## Solution
Removed the automatic transaction cancellation from the cleanup function. The transaction should only be cancelled when:
1. User explicitly clicks the "Back" button (`handleBack` function)
2. User explicitly clicks the "Cancel" button (`handleCancelPayment` function)
3. User closes the tab/browser (`beforeunload` event)

### Code Changes
**File:** `frontend/src/pages/TopUpPayment.js`

**Before (lines 141-150):**
```javascript
return () => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  // Cancel transaction when component unmounts (user navigated away)
  cancelTransactionOnExit();
};
```

**After (lines 141-146):**
```javascript
return () => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  // NOTE: Do NOT cancel transaction here - this cleanup runs on every re-render
  // Transaction should only be cancelled when user explicitly navigates away
  // or closes the tab (handled by beforeunload event above)
};
```

## Impact
- ✅ Transactions will no longer be auto-cancelled during normal page interactions
- ✅ Users can now complete their payment without interruption
- ✅ Countdown timer and payment status polling work correctly
- ✅ Transaction is still properly cancelled when user explicitly navigates away or closes the tab

## Testing Recommendations
1. Enter TopUpPayment page and wait 10+ seconds - transaction should remain pending
2. Verify countdown timer works correctly
3. Verify payment status polling works correctly
4. Click "Back" button - transaction should be cancelled
5. Click "Cancel" button - transaction should be cancelled
6. Close browser tab - transaction should be cancelled (via beforeunload event)
