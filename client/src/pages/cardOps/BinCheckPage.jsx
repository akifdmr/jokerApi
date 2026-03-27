import React from "react";
import CardOpConsole from "../../components/cardOps/CardOpConsole.jsx";
import { nmiApi } from "../../lib/nmiApi";
import { formatCardNumberMasked, normalizeCardNumber } from "../../lib/cardFormat";
import { cardOperationsHomePath, getProcessorFromQuery } from "./processorQuery";

export default function BinCheckPage({ onNavigate }) {
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
        title="Card BIN Check"
        actionLabel="Run BIN Check"
        onBack={() => onNavigate(cardOperationsHomePath())}
        fields={[processorField, { name: "pan", label: "Card Number", placeholder: "4111 1111 1111 1111" }]}
        transformBeforeSubmit={(form) => ({ ...form, pan: formatCardNumberMasked(form.pan) })}
        onSubmit={(form) => nmiApi.binCheck({ processor: form.processor, pan: normalizeCardNumber(form.pan) })}
      />
  );
}
