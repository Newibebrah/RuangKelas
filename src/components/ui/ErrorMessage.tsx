import { HiExclamationCircle } from "react-icons/hi";
import { Button } from "./Button";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-5">
        <HiExclamationCircle className="h-8 w-8 text-danger" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        Terjadi Kesalahan
      </h3>
      <p className="text-sm text-text-secondary text-center max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
