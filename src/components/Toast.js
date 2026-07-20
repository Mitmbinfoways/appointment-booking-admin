import { toast, Bounce } from "react-toastify";

const GLOBAL_TOAST_ID = "GLOBAL_SINGLE_TOAST";

export const Toast = ({
  message,
  type = "default",
  position = "top-center",
  autoClose = 2000,
}) => {
  if (toast.isActive(GLOBAL_TOAST_ID)) return;

  toast(message, {
    toastId: GLOBAL_TOAST_ID,
    type,
    position,
    autoClose,
    transition: Bounce,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};
