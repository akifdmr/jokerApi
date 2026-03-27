import React from "react";
import CardOpConsole from "../../components/cardOps/CardOpConsole.jsx";
import { nmiApi } from "../../lib/nmiApi";
import { formatCardNumberMasked, monthOptions, normalizeCardNumber, yearOptions } from "../../lib/cardFormat";
import { cardOperationsHomePath, getProcessorFromQuery } from "./processorQuery";

export default function BalanceCheckPage({ onNavigate }) {
  const months = monthOptions();
  const years = yearOptions();
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
      title="Balance Check"
      actionLabel="Run Balance Check"
      onBack={() => onNavigate(cardOperationsHomePath())}
      fields={[
        processorField,
        { name: "pan", label: "Card Number", placeholder: "4111 1111 1111 1111" },
        { name: "expMonth", label: "Exp Month", defaultValue: months[0].value, options: months },
        { name: "expYear", label: "Exp Year", defaultValue: years[0].value, options: years },
        { name: "cvv", label: "CVV", placeholder: "123", type: "password" },
      ]}
      transformBeforeSubmit={(form) => ({ ...form, pan: formatCardNumberMasked(form.pan) })}
      onSubmit={(form) =>
        nmiApi.balanceCheck({
          processor: form.processor,
          pan: normalizeCardNumber(form.pan),
          expMonth: form.expMonth,
          expYear: form.expYear,
          cvv: form.cvv,
        })
      }
    />
  );
}
