import React from "react";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";

const getStatusClass = (status) => {
  switch (status) {
    case "Confirmed":
      return "bg-green-50 text-green-700 border-green-200";
    case "Pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export default function AppointmentsTable({ bookings = [], onStatusClick, onDeleteClick }) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <Table>
        <THead>
          <TR>
            <TH>Booking ID</TH>
            <TH>Customer</TH>
            <TH>Service</TH>
            <TH>Date & Time</TH>
            <TH>Amount</TH>
            <TH>Status</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {bookings.length === 0 ? (
            <TR>
              <TD colSpan={7} className="px-6 py-10 text-center text-gray-400 text-sm">
                No bookings found.
              </TD>
            </TR>
          ) : (
            bookings.map((b) => (
              <TR key={b.id}>
                <TD className="text-sm font-semibold text-gray-900">
                  {b.id}
                </TD>
                <TD className="text-sm font-medium text-gray-700">
                  {b.customerName}
                </TD>
                <TD>
                  {b.serviceName}
                </TD>
                <TD className="text-gray-600">
                  <span className="block font-medium">{b.date}</span>
                  <span className="text-xs text-gray-400">{b.time}</span>
                </TD>
                <TD className="font-semibold text-gray-700">
                  ₹{b.amount}
                </TD>
                <TD>
                  <span
                    onClick={() => onStatusClick && onStatusClick(b)}
                    className={`inline-flex px-2.5 py-1 text-xs font-semibold border rounded-full cursor-pointer hover:opacity-85 transition-opacity ${getStatusClass(
                      b.status
                    )}`}
                  >
                    {b.status}
                  </span>
                </TD>
                <TD className="text-right font-medium">
                  <button
                    onClick={() => onStatusClick && onStatusClick(b)}
                    className="text-blue-600 hover:text-blue-900 mr-3 focus:outline-none"
                  >
                    Status
                  </button>
                  <button
                    onClick={() => onDeleteClick && onDeleteClick(b)}
                    className="text-red-600 hover:text-red-900 focus:outline-none"
                  >
                    Delete
                  </button>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
