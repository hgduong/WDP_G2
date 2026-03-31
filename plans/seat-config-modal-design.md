# Seat Configuration Modal - UI Design

## Overview
Redesign the seat management modal in CinemaManagement.js to use a visual grid-based interface instead of the current list-based approach.

## Current State
- Modal shows seats in a simple list format
- Add/edit seats via form inputs (row, number, type)
- No visual grid representation
- No ability to add rows or configure multiple seats at once

## New Design Requirements

### 1. Modal Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Cấu hình ghế - Phòng 1                                    [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [+] Thêm hàng    [+] Thêm ghế    [Lưu]    [Hủy]           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                        MÀN HÌNH                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Hàng A:  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]   + -     │ │
│  │  Hàng B:  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]        │ │
│  │  Hàng C:  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]        │ │
│  │  Hàng D:  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]        │ │
│  │  Hàng E:  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]        │ │
        + -
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Chú thích:                                                  │ │
│  │  [■] Standard    [■] VIP    [■] Couple    [■] Trống         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```


### 2. Grid Layout Details

#### Default Configuration
- **Rows**: 5 (A, B, C, D, E)
- **Columns**: 10 (1-10)
- **Total seats**: 50
- **Default seat type**: Standard
- **Default status**: Available

#### Grid Display
- Each seat is a clickable cell/button
- Row labels on the left (A, B, C, D, E)
- Column numbers on top (1-10)
- Screen indicator at the top (visual representation of movie screen)

### 3. Seat Cell States & Colors

| Seat Type | Status | Color | Visual |
|-----------|--------|-------|--------|
| Standard | Available | Light Blue (#E3F2FD) | [1] |
| Standard | Booked | Gray (#9E9E9E) | [1] (disabled) |
| VIP | Available | Gold (#FFD700) | [1] |
| VIP | Booked | Gray (#9E9E9E) | [1] (disabled) |
| Couple | Available | Pink (#FFC0CB) | [1] (wider) |
| Couple | Booked | Gray (#9E9E9E) | [1] (disabled) |
| Empty | N/A | Transparent | [ ] (dashed border) |

### 4. Interactive Features

#### 4.1 Click on Seat Cell
- Opens a popover/dropdown menu with options:
  - **Loại ghế** (Seat Type):
    - Standard
    - VIP
    - Couple
  - **Trạng thái** (Status):
    - Còn trống (Available)
    - Đã đặt (Booked)
  - **Xóa ghế** (Delete Seat)

#### 4.2 Add Row Button [+] Thêm hàng
- Adds a new row at the bottom
- Row label auto-increments (F, G, H, etc.)
- New row has same number of columns as existing rows
- All new seats default to Standard type, Available status

#### 4.3 Add Seat Button [+] Thêm ghế
- Adds a new column to the right of all rows
- Column number auto-increments (11, 12, 13, etc.)
- All existing rows get a new seat in the new column

#### 4.4 Delete Row
- Hover over row label shows delete icon
- Click to delete entire row
- Confirmation dialog before deletion

#### 4.5 Delete Column
- Hover over column number shows delete icon
- Click to delete entire column
- Confirmation dialog before deletion

### 5. Action Buttons

#### Top Toolbar
```
[+] Thêm hàng    [+] Thêm ghế    [Đặt lại]    [Lưu]    [Hủy]
```

- **[+] Thêm hàng**: Add new row
- **[+] Thêm ghế**: Add new column
- **[Đặt lại]**: Reset to default (5x10 grid, all Standard, Available)
- **[Lưu]**: Save all changes to database
- **[Hủy]**: Close modal without saving

### 6. Seat Configuration Panel (Right Side)

When a seat is selected, show a configuration panel:

```
┌─────────────────────────────┐
│  Cấu hình ghế: A1           │
├─────────────────────────────┤
│  Loại ghế:                  │
│  ○ Standard                 │
│  ○ VIP                      │
│  ○ Couple                   │
│                              │
│  Trạng thái:                │
│  ○ Còn trống                │
│  ○ Đã đặt                   │
│                              │
│  [Áp dụng cho tất cả]       │
│  [Xóa ghế]                  │
└─────────────────────────────┘
```

### 7. Bulk Actions

#### Apply to All Seats
- Checkbox/button to select all seats
- Apply type/status change to all selected seats
- Useful for initial setup

#### Apply to Row
- Click row label to select entire row
- Apply changes to all seats in that row

#### Apply to Column
- Click column number to select entire column
- Apply changes to all seats in that column

### 8. Visual Indicators

#### Seat Numbers
- Display seat number inside each cell (e.g., A1, A2, B1, B2)
- Font size: 12px
- Color: White on colored background, Black on light background

#### Hover Effects
- Seat cell: Slight scale up (1.05x)
- Show tooltip with seat info (type, status)

#### Selected State
- Border: 2px solid #2196F3
- Background: Slightly darker shade

### 9. Responsive Design

#### Desktop (>1024px)
- Full grid visible
- Configuration panel on right side

#### Tablet (768px-1024px)
- Grid with horizontal scroll if needed
- Configuration panel below grid

#### Mobile (<768px)
- Grid with horizontal scroll
- Configuration panel as bottom sheet

### 10. Data Structure

```javascript
// Seat grid state
const [seatGrid, setSeatGrid] = useState({
  rows: 5,
  columns: 10,
  seats: [
    // Each seat object
    {
      id: 'temp_A1', // or existing _id from database
      row: 'A',
      number: 1,
      type: 'Standard', // Standard, VIP, Couple
      status: 'Available', // Available, Booked
      isNew: true, // true if not yet saved to DB
      isModified: false // true if modified but not saved
    }
    // ... more seats
  ]
});
```

### 11. API Integration

#### On Save
1. Compare current grid with original data
2. Identify:
   - New seats to create
   - Modified seats to update
   - Deleted seats to remove
3. Batch API calls:
   - `addSeat()` for new seats
   - `updateSeat()` for modified seats
   - `deleteSeat()` for removed seats
4. Refresh seat data after successful save

### 12. Validation Rules

- Row labels must be unique (A, B, C, etc.)
- Seat numbers must be unique within each row
- Cannot delete all seats (minimum 1 seat required)
- Cannot have more than 26 rows (A-Z)
- Cannot have more than 50 columns per row

### 13. Error Handling

- Show toast notifications for:
  - Save success
  - Save failure
  - Validation errors
  - Network errors
- Highlight problematic seats in red

### 14. Loading States

- Show spinner while loading seats
- Show spinner while saving changes
- Disable all buttons during save operation

## Implementation Notes

### State Management
```javascript
const [seatGrid, setSeatGrid] = useState({
  rows: 5,
  columns: 10,
  seats: []
});

const [selectedSeat, setSelectedSeat] = useState(null);
const [originalSeats, setOriginalSeats] = useState([]); // For comparison on save
```

### Key Functions to Add
```javascript
// Add new row
const handleAddRow = () => { ... }

// Add new column
const handleAddColumn = () => { ... }

// Delete row
const handleDeleteRow = (rowLabel) => { ... }

// Delete column
const handleDeleteColumn = (columnNumber) => { ... }

// Update seat type/status
const handleUpdateSeat = (seatId, updates) => { ... }

// Save all changes
const handleSaveAllSeats = async () => { ... }

// Reset to default
const handleResetGrid = () => { ... }

// Select seat for configuration
const handleSelectSeat = (seat) => { ... }

// Apply changes to multiple seats
const handleBulkUpdate = (seatIds, updates) => { ... }
```

### CSS Classes to Add
```css
.seat-grid-container { ... }
.seat-grid { ... }
.seat-row { ... }
.seat-cell { ... }
.seat-cell.standard { ... }
.seat-cell.vip { ... }
.seat-cell.couple { ... }
.seat-cell.booked { ... }
.seat-cell.selected { ... }
.seat-cell.empty { ... }
.screen-indicator { ... }
.row-label { ... }
.column-number { ... }
.seat-config-panel { ... }
.legend { ... }
```

## Comparison: Before vs After

### Before (Current)
- List-based seat display
- Add/edit one seat at a time
- No visual grid
- No bulk operations

### After (New Design)
- Visual grid layout (5x10 default)
- Click-to-configure each seat
- Add rows/columns dynamically
- Bulk operations support
- Color-coded seat types
- Real-time preview
- Intuitive drag-and-drop feel

## User Flow

1. User clicks "Quản lý ghế" button on a room
2. Modal opens with 5x10 grid (default 50 seats)
3. User can:
   - Click any seat to change its type/status
   - Click "Thêm hàng" to add a new row
   - Click "Thêm ghế" to add a new column
   - Select multiple seats for bulk changes
   - Reset to default configuration
4. User clicks "Lưu" to save all changes
5. Modal closes, room data refreshes

## Accessibility

- Keyboard navigation support (arrow keys to move between seats)
- Screen reader support (ARIA labels for seat types and status)
- High contrast mode support
- Focus indicators for keyboard users
