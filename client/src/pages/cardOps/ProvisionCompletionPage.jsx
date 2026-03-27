import React from "react";
import CardOpConsole from "../../components/cardOps/CardOpConsole.jsx";
import { nmiApi } from "../../lib/nmiApi";
import { cardOperationsHomePath, getProcessorFromQuery } from "./processorQuery";

export default function ProvisionCompletionPage({ onNavigate }) {
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
      title="Provision Completion"
      actionLabel="Complete Provision"
      onBack={() => onNavigate(cardOperationsHomePath())}
      fields={[
        processorField,
        { name: "transactionId", label: "Transaction ID", placeholder: "USB-PRV-... / VFK-PRV-..." },
        { name: "amount", label: "Capture Amount", placeholder: "49.90", type: "number", required: false },
      ]}
      onSubmit={(form) =>
        nmiApi.provisionCompletion({
          processor: form.processor,
          transactionId: form.transactionId,
          amount: form.amount ? Number(form.amount) : undefined,
        })
      }
    />
  );
}
