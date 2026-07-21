import { HiExclamationCircle } from "react-icons/hi";
import { Button } from "./Button";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <HiExclamationCircle className="h-16 w-16 text-red-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        Terjadi Kesalahan
      </h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
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
