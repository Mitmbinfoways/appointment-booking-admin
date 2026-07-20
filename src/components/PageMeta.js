"use client";

import React, { useEffect } from "react";

const PageMeta = ({ title, description }) => {
  useEffect(() => {
    document.title = title || "Appointment Booking Admin";
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.name = "description";
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;
    }
  }, [title, description]);

  return null;
};

export const AppWrapper = ({ children }) => <>{children}</>;

export default PageMeta;
