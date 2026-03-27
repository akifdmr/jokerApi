import React from "react";
import CardOpConsole from "../../components/cardOps/CardOpConsole.jsx";
import { nmiApi } from "../../lib/nmiApi";
import { formatCardNumberMasked, monthOptions, normalizeCardNumber, yearOptions } from "../../lib/cardFormat";
import { cardOperationsHomePath, getProcessorFromQuery } from "./processorQuery";

export default function ProvisionPage({ onNavigate }) {
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
      title="Provision"
      actionLabel="Create Provision"
      onBack={() => onNavigate(cardOperationsHomePath())}
      fields={[
        processorField,
        { name: "pan", label: "Card Number", placeholder: "4111 1111 1111 1111" },
        { name: "expMonth", label: "Exp Month", defaultValue: months[0].value, options: months },
        { name: "expYear", label: "Exp Year", defaultValue: years[0].value, options: years },
        { name: "cvv", label: "CVV", placeholder: "123", type: "password" },
        { name: "amount", label: "Amount", placeholder: "49.90", type: "number" },
        { name: "currency", label: "Currency", placeholder: "USD", defaultValue: "USD", required: false },
        { name: "orderId", label: "Order ID", placeholder: "ORD-1001", required: false },
      ]}
      transformBeforeSubmit={(form) => ({ ...form, pan: formatCardNumberMasked(form.pan) })}
      onSubmit={(form) =>
        nmiApi.provision({
          processor: form.processor,
          pan: normalizeCardNumber(form.pan),
          expMonth: form.expMonth,
          expYear: form.expYear,
          cvv: form.cvv,
          amount: Number(form.amount),
          currency: form.currency,
          orderId: form.orderId,
        })
      }
    />
  );
}
