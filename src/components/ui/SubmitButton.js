"use client";
import { Check, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Notification from "@/components/Notification";
import Button from "@/components/ui/Button";
import { executeAction } from "@/lib/asyncAction";

export default function SubmitButton({
  label,
  loadingLabel,
  successLabel,
  errorLabel,
  icon,
  onClick,
  loading: externalLoading,
  state: externalState,
  successToast,
  errorToast,
  onSuccess,
  onError,
  disabled = false,
  variant = "primary",
  size = "normal",
  type = "button",
  className,
  successDuration = 1500,
  toastDuration = 3000,
  showInlineError = false,
  ...props
}) {
  const t = useTranslations("Common");
  const isAuto = typeof onClick === "function";

  const [internalLoading, setInternalLoading] = useState(false);
  const [internalStatus, setInternalStatus] = useState("idle");
  const [internalError, setInternalError] = useState(null);
  const [toast, setToast] = useState(null);

  const inFlightRef = useRef(false);
  const lastExternalStateRef = useRef(null);
  const successTimerRef = useRef(null);

  const loading = isAuto ? internalLoading : Boolean(externalLoading);
  const effectiveDisabled = disabled || loading;

  let visualStatus = "idle";
  let visualError = null;
  if (isAuto) {
    visualStatus = internalStatus;
    visualError = internalError;
  } else if (externalState) {
    if (externalState.ok === true) visualStatus = "success";
    else if (externalState.ok === false) {
      visualStatus = "error";
      visualError = externalState.error || null;
    }
  }

  useEffect(() => {
    if (isAuto) return;
    if (!externalState) return;
    if (lastExternalStateRef.current === externalState) return;
    lastExternalStateRef.current = externalState;
    if (externalState.ok === true && successToast) {
      setToast({
        type: "success",
        message: successToast,
        key: `${Date.now()}-${Math.random()}`,
      });
    } else if (externalState.ok === false && errorToast) {
      setToast({
        type: "error",
        message: errorToast,
        key: `${Date.now()}-${Math.random()}`,
      });
    }
  }, [externalState, isAuto, successToast, errorToast]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleClick = async (event) => {
    if (!isAuto) {
      if (effectiveDisabled) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
      }
      if (onClick) {
        const result = onClick(event);
        if (result && typeof result.then === "function") {
          await result;
        }
      }
      return;
    }

    if (inFlightRef.current || effectiveDisabled) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      return;
    }

    inFlightRef.current = true;
    setInternalLoading(true);
    setInternalStatus("idle");
    setInternalError(null);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    try {
      const result = await executeAction(() => onClick(event));
      if (result.ok) {
        setInternalStatus("success");
        if (successToast) {
          setToast({
            type: "success",
            message: successToast,
            key: `${Date.now()}-${Math.random()}`,
          });
        }
        if (onSuccess) onSuccess(result.data);
        if (successDuration > 0) {
          successTimerRef.current = setTimeout(() => {
            setInternalStatus("idle");
            successTimerRef.current = null;
          }, successDuration);
        }
      } else {
        setInternalStatus("error");
        setInternalError(result.error);
        if (errorToast) {
          setToast({
            type: "error",
            message: errorToast,
            key: `${Date.now()}-${Math.random()}`,
          });
        }
        if (onError) onError(result.error);
      }
    } finally {
      inFlightRef.current = false;
      setInternalLoading(false);
    }
  };

  const finalVariant = visualStatus === "error" ? "destructive" : variant;

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 size={16} className="animate-spin shrink-0" />
          <span>{loadingLabel || t("saving")}</span>
        </>
      );
    }
    if (visualStatus === "success") {
      return (
        <>
          <Check size={16} className="shrink-0" />
          <span>{successLabel || t("saved")}</span>
        </>
      );
    }
    if (visualStatus === "error") {
      return (
        <>
          <X size={16} className="shrink-0" />
          <span>{errorLabel || t("error")}</span>
        </>
      );
    }
    return (
      <>
        {icon}
        <span>{label}</span>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type={type}
        onClick={handleClick}
        disabled={effectiveDisabled}
        variant={finalVariant}
        size={size}
        className={className}
        aria-busy={loading || undefined}
        {...props}
      >
        {renderContent()}
      </Button>
      {showInlineError && visualStatus === "error" && visualError && (
        <p
          role="alert"
          aria-live="polite"
          className="text-destructive text-xs text-center"
        >
          {visualError}
        </p>
      )}
      {toast && (
        <Notification
          key={toast.key}
          message={toast.message}
          type={toast.type}
          duration={toastDuration}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
