"use client";

type StepPanelProps = {
  stepKey: string;
  direction: "forward" | "back";
  children: React.ReactNode;
};

export function StepPanel({ stepKey, direction, children }: StepPanelProps) {
  return (
    <section
      key={stepKey}
      className={direction === "forward" ? "love-step-forward" : "love-step-back"}
    >
      {children}
    </section>
  );
}
