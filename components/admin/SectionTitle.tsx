import clsx from "clsx";
import { Text } from "react-native";

export default function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text className={clsx("text-base font-kumbh text-gray-700", className)}>
      {children}
    </Text>
  );
}
