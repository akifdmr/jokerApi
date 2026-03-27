import React from "react";
import CardOpConsole from "../../components/cardOps/CardOpConsole.jsx";
import { nmiApi } from "../../lib/nmiApi";
import { cardOperationsHomePath, getProcessorFromQuery } from "./processorQuery";

export default function CancelPage({ onNavigate }) {
  const processorField = {
    name: "processor",
    label: "Processor",
    defaultValue: getProcessorFromQuery("us-bank"),
    options: [
      { value: "us-bank", label: "US Bank" },
      { value: "vakifbank", label: "Vakifbank VPOS" },
      { value: "nmi", label: "NMI Payment" },
    ],
  };

  return (
    <CardOpConsole
      title="Cancel / Void"
      actionLabel="Cancel Transaction"
      onBack={() => onNavigate(cardOperationsHomePath())}
      fields={[
        processorField,
        { name: "transactionId", label: "Transaction ID", placeholder: "USB-PRV-... / VFK-PRV-..." },
      ]}
      onSubmit={(form) => nmiApi.cancel({ processor: form.processor, transactionId: form.transactionId })}
    />
  );
}
