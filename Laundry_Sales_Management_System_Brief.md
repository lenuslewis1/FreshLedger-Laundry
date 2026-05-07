# Laundry Sales and Management System Brief

## Objective

Build a system that helps a laundry business manage customer orders, sales, payments, garment tracking, delivery, expenses, staff activity, and business reporting from one place.

## Main Users

- Owner / Admin: manages the business, views reports, controls pricing, tracks staff and revenue.
- Reception / Sales Staff: creates orders, records payments, updates customer information.
- Laundry Operations Staff: tracks washing, drying, ironing, packaging, and completion status.
- Delivery Staff: manages pickup and delivery tasks.
- Customer: receives order updates, payment reminders, and pickup / delivery notifications.

## Core Problems To Solve

- Manual order books make it hard to track items and deadlines.
- Sales and payments are difficult to reconcile at the end of the day.
- Customers often call to ask if their laundry is ready.
- Staff activity is not easy to audit.
- Owners lack clear reports on revenue, outstanding balances, top customers, expenses, and service performance.

## Recommended MVP Features

### 1. Dashboard

- Daily sales summary
- Total orders received
- Orders in progress
- Ready-for-pickup orders
- Delivered orders
- Outstanding balances
- Today’s pickup and delivery tasks

### 2. Customer Management

- Customer name, phone number, address, and notes
- Customer order history
- Customer balance and payment history
- Optional customer tags such as VIP, hotel, corporate, walk-in, or regular

### 3. Order Management

- Create laundry order
- Add garment/service items
- Quantity, unit price, discount, and total
- Pickup or delivery option
- Due date and priority
- Order status tracking:
  - Received
  - Sorting
  - Washing
  - Drying
  - Ironing
  - Packaging
  - Ready
  - Delivered / Collected
  - Cancelled
- Printable or shareable receipt

### 4. Sales and Payments

- Record full or partial payments
- Payment methods: cash, mobile money, bank transfer, card
- Automatic balance calculation
- Daily sales report
- Refund or adjustment tracking
- Cashier shift summary

### 5. Price List / Services

- Admin-managed service list
- Example services:
  - Wash and fold
  - Dry cleaning
  - Ironing only
  - Bedsheets
  - Suits
  - Curtains
  - Express service
- Different prices by item, weight, or service type

### 6. Inventory and Supplies

- Track detergents, packaging bags, tags, hangers, and other consumables
- Low-stock alerts
- Stock usage logs
- Supplier records

### 7. Expenses

- Record rent, electricity, water, salaries, detergent, fuel, repairs, and other costs
- Categorize expenses
- Monthly profit summary

### 8. Staff Management

- Staff accounts and roles
- Activity logs
- Order assignments
- Shift sales tracking
- Optional commission or performance reporting

### 9. Notifications

- SMS or WhatsApp alerts for:
  - Order received
  - Order ready
  - Payment balance reminder
  - Delivery on the way
- Admin alerts for overdue orders and low stock

### 10. Reports

- Daily, weekly, and monthly revenue
- Orders by status
- Top customers
- Most requested services
- Outstanding customer balances
- Expenses and profit estimate
- Staff sales and activity report

## Suggested Data Model

### Customers

- Customer ID
- Name
- Phone
- Address
- Customer type
- Notes
- Created date

### Orders

- Order ID
- Customer ID
- Order date
- Due date
- Status
- Service type
- Pickup / delivery option
- Subtotal
- Discount
- Total amount
- Amount paid
- Balance
- Created by

### Order Items

- Item ID
- Order ID
- Service ID
- Description
- Quantity
- Unit price
- Line total

### Payments

- Payment ID
- Order ID
- Amount
- Payment method
- Payment date
- Received by
- Notes

### Services

- Service ID
- Service name
- Pricing type
- Default price
- Active status

### Expenses

- Expense ID
- Category
- Description
- Amount
- Date
- Recorded by

### Inventory

- Item ID
- Item name
- Quantity available
- Reorder level
- Unit cost
- Supplier

## Recommended Build Approach

### Option A: Web App

Best for a growing laundry business with multiple staff, branches, or remote owner access.

- Works on laptop, tablet, and phone browser
- Admin dashboard
- Staff logins
- Cloud database
- Easy to expand later

### Option B: Mobile-First Web App

Best if most operations happen on phones at the counter and during delivery.

- Same system as a web app but designed primarily for mobile use
- Fast order creation
- Simple daily sales screens
- Delivery-friendly interface

### Option C: Spreadsheet-Based Starter System

Best for a very small business that needs structure immediately but is not ready for custom software.

- Customer sheet
- Order tracker
- Payment tracker
- Expense tracker
- Dashboard sheet
- Lower cost, but limited automation and security

## Recommended MVP Timeline

### Week 1: Discovery and Design

- Confirm business workflow
- Confirm price list and services
- Confirm user roles
- Design screens and database structure

### Weeks 2-4: MVP Build

- Customer management
- Order management
- Sales and payments
- Dashboard
- Basic reports
- Receipt generation

### Week 5: Testing and Training

- Test with real sample orders
- Fix workflow issues
- Train staff
- Prepare launch checklist

### Week 6: Launch

- Import existing customers if available
- Go live
- Monitor daily usage
- Add improvements based on feedback

## Future Enhancements

- Multi-branch support
- Barcode or QR code garment tags
- Customer portal
- Loyalty points
- WhatsApp bot for order status
- Accounting integration
- Delivery route planning
- Subscription laundry plans for corporate clients

## Key Questions For The Client

1. How many branches does the laundry business have?
2. How many staff will use the system?
3. Do customers pay before service, after service, or both?
4. Does the business offer pickup and delivery?
5. Are prices based on item type, weight, customer type, or service package?
6. Should customers receive SMS or WhatsApp notifications?
7. Does the business need printed receipts?
8. Should the owner see reports remotely?
9. Are there existing customer/order records to import?
10. What is the budget and preferred launch date?

## Recommended First Version

The first version should be a mobile-friendly web app with:

- Admin and staff login
- Customer records
- Order creation and tracking
- Payment recording
- Receipt generation
- Daily sales dashboard
- Basic expense tracking
- Order status notifications

This gives the client a practical operational system quickly, while leaving room for inventory, delivery routing, loyalty programs, and multi-branch support later.
