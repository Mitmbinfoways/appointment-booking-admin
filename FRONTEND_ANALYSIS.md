# Frontend Project Analysis & Integration Specification

This document provides a comprehensive structural and logic analysis of the **`appointment-booking-admin`** frontend application, detailing its architecture, active/completed modules, and integration mapping with our backend API.

---

## 1. Technology Stack & Key Dependencies

As defined in the `package.json`, the frontend is built using a modern React & Next.js ecosystem:

| Package | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.2.10` (App Router) | React Framework with Server/Client component support |
| **React & React DOM** | `19.2.4` | Core UI library |
| **TailwindCSS** | `^4` | Styling utility framework |
| **@reduxjs/toolkit** | `^2.12.0` | Global state container & slice management |
| **Axios** | `^1.18.1` | HTTP Request/Response client with interceptors |
| **React Flatpickr** | `^4.0.11` | Calendar input components |
| **React Toastify** | `^11.1.0` | Popup notifications |
| **SweetAlert2** | `^11.26.25` | Modern confirm modals |

---

## 2. Directory Structure & Key Files

The `src/` directory is structured logically:

* **`src/app/`**: Next.js App Router root.
  * **`(auth)/`**: Route group containing user authentication pages.
    * `login/page.js`: Standard login view connected to backend auth endpoints.
  * **`(admin)/`**: Route group containing the admin console dashboard pages, sharing a common sidebar layout.
    * `dashboard/`: Dashboard landing metrics page (mounted as `/`).
    * `appointments/`: Booking list table panel (`/appointments`).
    * `admins/page.js` **[NEW]**: SuperAdmin console panel for Admin account management, edits, soft-deletions, and status switches.
    * `profile/page.js` **[NEW]**: Shared configuration view for personal credentials changes and password resets.
  * `globals.css`: Global tailwind styling definitions.
* **`src/components/`**: Reusable modular visual components.
  * `layout/`: App Shell elements:
    * `AppHeader.js`: Navbar headers with profile dropdowns.
    * `AppSidebar.js`: Collapsible navigation list.
    * `menu.js`: Static menu item declarations mapped dynamically to user role (`Admin` vs `SuperAdmin`).
* **`src/config/`**:
  * `AxiosConfig.js`: Interceptor setups for JWT authorization headers, timezone headers, session checks, and API wrapper functions.
* **`src/store/`**:
  * `slices/authSlice.js`: Manages authenticated admin/superadmin profile details, loading state indicators, and logouts.

---

## 3. Detailed Code Analysis: Appointments Page

We analyzed **`src/app/(admin)/appointments/page.js`** and **`src/components/UI/table/AppointmentsTable.js`** and identified two major findings:

### 3.1 State Isolation & Mock Operations
Currently, the appointments page retrieves and manages bookings using mock data operations:
* **Load:** On load, `fetchBookings()` calls `getBookings()` from `AxiosConfig.js`, which returns static dummy data.
* **Create (Add Modal):** The `handleAddBooking()` function creates a mock object:
  ```javascript
  const newBooking = {
    id: `B-${Math.floor(100 + Math.random() * 900)}`,
    customerName: newBookingData.customerName,
    serviceName: newBookingData.serviceName,
    date: newBookingData.date,
    time: newBookingData.time,
    status: "Confirmed",
    amount: Number(newBookingData.amount),
  };
  ```
  It prepends this to the React state list (`bookingsList`) and triggers a local toast notification.
* **Update (Status Modal):** `handleSaveStatus()` maps over the local `bookingsList` state to update the status string.
* **Delete:** `handleConfirmDelete()` filters the local `bookingsList` state.

**No HTTP write requests (`POST`, `PUT`, `DELETE`) are sent to the backend server.**

### 3.2 Data Schema Mismatch (Static Columns vs. Dynamic Fields)
The frontend components are currently hardcoded around static customer properties:
* The `AppointmentsTable.js` renders columns:
  * **Booking ID** (`b.id`)
  * **Customer Name** (`b.customerName`)
  * **Service Name** (`b.serviceName`)
  * **Date & Time** (`b.date` & `b.time`)
  * **Amount** (`b.amount`)
  * **Status** (`b.status`)

**The Mismatch:**
Our backend database design stores custom booking fields dynamically inside a Mongoose `Map` called `dynamicResponses` (defined in the `FormConfig` schema). For example, one Admin might configure fields `['firstName', 'lastName', 'phone', 'email']`, while another might specify `['fullName', 'petName', 'allergies']`.

---

## 4. Gap Resolution & Integration Strategy

### Step 1: Base URL Alignment
Update the `baseURL` inside `AxiosConfig.js` to target our active backend (running on port `5000`):
```javascript
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### Step 2: Adapt Endpoint Mapping
Modify the wrapper functions in `src/config/AxiosConfig.js` to point to our backend routes instead of client-side mocks:
* **Login:** Redirect `/api/v1/auth/login` to `POST /api/admin/auth/login`.
* **Profile:** Redirect `/api/v1/auth/profile` to `GET /api/admin/profile`.
* **Dashboard Stats:** Un-mock `getDashboardStats()` and fetch stats dynamically.
* **Bookings List:** Change `getBookings()` to query `GET /api/admin/bookings`.

### Step 3: Implement Dynamic Form Fields Rendering
Instead of hardcoding inputs inside the "Add Appointment" modal, the frontend should fetch the Admin's custom configuration:
1. Call `GET /api/public/form-config/:adminId` on modal load.
2. Iterate through the array of fields and dynamically render `<input>` elements (text, number, select, tel) sorted by `order`.
3. Submit the user inputs mapped as key-value pairs inside `dynamicResponses`:
   ```json
   {
     "slotDate": "2026-07-25",
     "slotStartTime": "10:00",
     "slotEndTime": "10:30",
     "dynamicResponses": {
       "firstName": "John",
       "lastName": "Doe",
       "phone": "+919876543210",
       "email": "john.doe@example.com"
     }
   }
   ```

### Step 4: Add HTTP Operations inside Appointments View
Replace the client-side state filters inside `src/app/(admin)/appointments/page.js` with Axios requests:
* **Create Booking:**
  ```javascript
  const res = await axiosInstance.post(`/api/bookings/${adminId}`, payload);
  ```
* **Update Status:**
  ```javascript
  const res = await axiosInstance.put(`/api/admin/bookings/${bookingId}`, { status: newStatus });
  ```
* **Delete Booking:**
  ```javascript
  const res = await axiosInstance.delete(`/api/admin/bookings/${bookingId}`);
  ```
* After successful operations, trigger a refetch (`fetchBookings()`) to sync list values.

---

## 5. Built Integration Modules

The following custom scheduling console modules have been implemented and connected to the backend API:

### 5.1 SuperAdmin Admin Profiles Manager [COMPLETED]
- **Route**: `/admins` (`src/app/(admin)/admins/page.js`)
- Displays all active admins in a table including columns: `Sr No`, `Username`, `Email`, `Business Name`, `Created Date`, `Status`, and `Actions`.
- **Sliding Toggle Switch**: Operates real-time active state switches (`isActive`) through `PUT /api/superadmin/admins/:id/toggle`.
- **Edit Modal**: Updates sub-admin username, email, and business name via `PUT /api/superadmin/admins/:id`.
- **Delete Confirm Modal**: Sets account `isDeleted: true` and `isActive: false` (soft deletion) using `DELETE /api/superadmin/admins/:id`, immediately dropping the record from active lists.

### 5.2 Shared Profile Settings & Password Resets [COMPLETED]
- **Route**: `/profile` (`src/app/(admin)/profile/page.js`)
- **Profile Info Form**: Edits username, email, and businessName (Admins only) via `PUT /api/admin/profile`. Automatically dispatches updates to Redux (`setAdmin`) to refresh the header user display immediately.
- **Change Password Form**: Compares current password, hashes and updates password via `PUT /api/admin/profile/change-password`.
