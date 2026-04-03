# Seat Configuration Modal - Visual Wireframe

## Main Modal Layout

```mermaid
graph TB
    subgraph Modal["Cấu hình ghế - Phòng 1 [X]"]
        subgraph Toolbar["Toolbar"]
            AddRow["➕ Thêm hàng"]
            AddCol["➕ Thêm ghế"]
            Reset["🔄 Đặt lại"]
            Save["💾 Lưu"]
            Cancel["❌ Hủy"]
        end
        
        subgraph Screen["MÀN HÌNH"]
        end
        
        subgraph GridArea["Seat Grid Area"]
            subgraph RowA["Hàng A"]
                A1["A1"]
                A2["A2"]
                A3["A3"]
                A4["A4"]
                A5["A5"]
                A6["A6"]
                A7["A7"]
                A8["A8"]
                A9["A9"]
                A10["A10"]
            end
            subgraph RowB["Hàng B"]
                B1["B1"]
                B2["B2"]
                B3["B3"]
                B4["B4"]
                B5["B5"]
                B6["B6"]
                B7["B7"]
                B8["B8"]
                B9["B9"]
                B10["B10"]
            end
            subgraph RowC["Hàng C"]
                C1["C1"]
                C2["C2"]
                C3["C3"]
                C4["C4"]
                C5["C5"]
                C6["C6"]
                C7["C7"]
                C8["C8"]
                C9["C9"]
                C10["C10"]
            end
            subgraph RowD["Hàng D"]
                D1["D1"]
                D2["D2"]
                D3["D3"]
                D4["D4"]
                D5["D5"]
                D6["D6"]
                D7["D7"]
                D8["D8"]
                D9["D9"]
                D10["D10"]
            end
            subgraph RowE["Hàng E"]
                E1["E1"]
                E2["E2"]
                E3["E3"]
                E4["E4"]
                E5["E5"]
                E6["E6"]
                E7["E7"]
                E8["E8"]
                E9["E9"]
                E10["E10"]
            end
        end
        
        subgraph Legend["Chú thích"]
            L1["■ Standard"]
            L2["■ VIP"]
            L3["■ Couple"]
            L4["□ Trống"]
        end
    end
```

## Seat Cell States

```mermaid
stateDiagram-v2
    [*] --> Standard: Default
    Standard --> VIP: Click → Change Type
    Standard --> Couple: Click → Change Type
    Standard --> Empty: Click → Delete
    VIP --> Standard: Click → Change Type
    VIP --> Couple: Click → Change Type
    VIP --> Empty: Click → Delete
    Couple --> Standard: Click → Change Type
    Couple --> VIP: Click → Change Type
    Couple --> Empty: Click → Delete
    Empty --> Standard: Click → Add Seat
    Empty --> VIP: Click → Add Seat
    Empty --> Couple: Click → Add Seat
```

## User Interaction Flow

```mermaid
flowchart TD
    Start([User clicks 'Quản lý ghế']) --> OpenModal[Open Seat Config Modal]
    OpenModal --> LoadSeats[Load existing seats from DB]
    LoadSeats --> DisplayGrid[Display 5x10 grid]
    
    DisplayGrid --> UserAction{User Action?}
    
    UserAction -->|Click Seat| ShowPopover[Show popover menu]
    ShowPopover --> ChangeType[Change seat type]
    ShowPopover --> ChangeStatus[Change status]
    ShowPopover --> DeleteSeat[Delete seat]
    
    UserAction -->|Click Add Row| AddNewRow[Add new row at bottom]
    AddNewRow --> UpdateGrid[Update grid display]
    
    UserAction -->|Click Add Column| AddNewCol[Add new column at right]
    AddNewCol --> UpdateGrid
    
    UserAction -->|Click Reset| ResetGrid[Reset to 5x10 default]
    ResetGrid --> UpdateGrid
    
    UserAction -->|Click Save| ValidateData[Validate changes]
    ValidateData --> SaveToDB[Save to database]
    SaveToDB --> ShowSuccess[Show success message]
    ShowSuccess --> CloseModal[Close modal]
    
    UserAction -->|Click Cancel| ConfirmClose{Unsaved changes?}
    ConfirmClose -->|Yes| ShowConfirm[Show confirmation]
    ConfirmClose -->|No| CloseModal
    ShowConfirm -->|Discard| CloseModal
    ShowConfirm -->|Keep| UserAction
```

## Seat Popover Menu

```mermaid
graph LR
    subgraph Popover["Popover Menu - Seat A1"]
        subgraph TypeSection["Loại ghế"]
            Radio1["○ Standard"]
            Radio2["○ VIP"]
            Radio3["○ Couple"]
        end
        subgraph StatusSection["Trạng thái"]
            Radio4["○ Còn trống"]
            Radio5["○ Đã đặt"]
        end
        subgraph Actions["Actions"]
            Btn1["Áp dụng cho hàng"]
            Btn2["Áp dụng cho cột"]
            Btn3["Xóa ghế"]
        end
    end
```

## Color Scheme

```mermaid
graph LR
    subgraph Colors["Seat Type Colors"]
        Standard["Standard<br/>#E3F2FD<br/>Light Blue"]
        VIP["VIP<br/>#FFD700<br/>Gold"]
        Couple["Couple<br/>#FFC0CB<br/>Pink"]
        Booked["Booked<br/>#9E9E9E<br/>Gray"]
        Empty["Empty<br/>Transparent<br/>Dashed Border"]
    end
```

## Grid Layout Dimensions

```mermaid
graph TB
    subgraph Dimensions["Grid Dimensions"]
        subgraph Default["Default Configuration"]
            Rows["Rows: 5 (A-E)"]
            Cols["Columns: 10 (1-10)"]
            Total["Total: 50 seats"]
        end
        
        subgraph CellSize["Cell Size"]
            Width["Width: 40px"]
            Height["Height: 40px"]
            Gap["Gap: 4px"]
        end
        
        subgraph Spacing["Spacing"]
            RowGap["Row gap: 8px"]
            ColGap["Column gap: 4px"]
            Padding["Grid padding: 16px"]
        end
    end
```

## Configuration Panel (Right Side)

```mermaid
graph TB
    subgraph ConfigPanel["Cấu hình ghế: A1"]
        subgraph TypeConfig["Loại ghế"]
            T1["○ Standard"]
            T2["○ VIP"]
            T3["○ Couple"]
        end
        
        subgraph StatusConfig["Trạng thái"]
            S1["○ Còn trống"]
            S2["○ Đã đặt"]
        end
        
        subgraph BulkActions["Áp dụng hàng loạt"]
            BA1["☑ Chọn tất cả"]
            BA2["☑ Chọn hàng A"]
            BA3["☑ Chọn cột 1"]
        end
        
        subgraph ActionButtons["Actions"]
            AB1["Áp dụng"]
            AB2["Xóa ghế"]
        end
    end
```

## Responsive Layout

```mermaid
graph LR
    subgraph Desktop[Desktop >1024px]
        D_Grid[Grid Left]
        D_Config[Config Right]
    end
    
    subgraph Tablet[Tablet 768-1024px]
        T_Grid[Grid Top]
        T_Config[Config Bottom]
    end
    
    subgraph Mobile[Mobile <768px]
        M_Grid[Grid Full Width]
        M_Config[Bottom Sheet]
    end
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant State
    participant API
    participant DB
    
    User->>UI: Click "Quản lý ghế"
    UI->>API: getSeatsByRoom(roomId)
    API->>DB: Query seats
    DB-->>API: Return seats
    API-->>UI: Seat data
    UI->>State: Initialize seatGrid
    State-->>UI: Render 5x10 grid
    
    User->>UI: Click seat A1
    UI->>State: setSelectedSeat(A1)
    State-->>UI: Show popover
    
    User->>UI: Change type to VIP
    UI->>State: Update seatGrid[A1].type = 'VIP'
    State-->>UI: Re-render seat A1
    
    User->>UI: Click "Thêm hàng"
    UI->>State: Add new row F
    State-->>UI: Re-render grid with row F
    
    User->>UI: Click "Lưu"
    UI->>State: Get modified seats
    State-->>UI: Return changes
    UI->>API: Batch update seats
    API->>DB: Save changes
    DB-->>API: Success
    API-->>UI: Confirmation
    UI-->>User: Show success toast
```

## Key Features Summary

1. **Visual Grid Layout**: 5 rows × 10 columns by default
2. **Click-to-Configure**: Click any seat to change type/status
3. **Dynamic Rows/Columns**: Add rows and columns on demand
4. **Color Coding**: Different colors for seat types
5. **Bulk Operations**: Apply changes to multiple seats
6. **Real-time Preview**: See changes immediately
7. **Reset Option**: Return to default configuration
8. **Validation**: Prevent invalid configurations
9. **Responsive Design**: Works on all screen sizes
10. **Accessibility**: Keyboard navigation and screen reader support
