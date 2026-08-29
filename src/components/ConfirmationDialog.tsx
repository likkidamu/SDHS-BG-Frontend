import { Alert } from 'react-native';

type ConfirmationDialogOptions = {
  title: string;
  message: string;
  confirm: () => void;
  cancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function showConfirmationDialog({
  title,
  message,
  confirm,
  cancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmationDialogOptions): void {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel', onPress: cancel },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: confirm,
    },
  ]);
}
