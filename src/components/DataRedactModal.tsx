import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export interface RedactOption {
  id: string;
  title: string;
  description: string;
  examples: string[];
}

export const REDACT_OPTIONS: RedactOption[] = [
  {
    id: 'pii',
    title: '1. PII Data',
    description: 'Personally Identifiable Information. This must be the first priority for redaction.',
    examples: [
      'Social Security Numbers (SSN), driver’s license numbers, and passport details.',
      'Full names, physical addresses, email addresses, and phone numbers.',
      'Biometric data.'
    ]
  },
  {
    id: 'ip',
    title: '2. Corporate Intellectual Property (IP) & Trade Secrets',
    description: 'Exposing core business logic or proprietary formulas in non-production test environments introduces severe competitive risks. Masking keeps operations functional without giving away proprietary company value:',
    examples: [
      'Proprietary source code, algorithm designs, and database schema logic.',
      'Product schematics, blue prints, patents in progress, and chemical formulations.',
      'Strategic business plans, expansion strategies, and unreleased market research.'
    ]
  },
  {
    id: 'pci',
    title: '3. Financial & Payment Card Industry (PCI) Data',
    description: 'Financial details are targeted heavily by cybercriminals. Frameworks like the PCI-DSS demand rigorous protection of financial fields outside of standard production environments:',
    examples: [
      'Primary Account Numbers (PAN) and credit/debit card cardholder information.',
      'Bank routing numbers and international transaction codes (SWIFT/IBAN).',
      'Corporate financial ledgers, revenue metrics, and proprietary algorithmic trading data.'
    ]
  },
  {
    id: 'internal',
    title: '4. Internal Operational & Commercial Data',
    description: 'Internal records that do not contain consumer PII can still severely damage an enterprise if leaked. This data is regularly masked before being handed over to third-party consultants or external developers:',
    examples: [
      'Supplier pricing agreements, vendor contracts, and custom discount structures.',
      'Inventory logistics, supply chain routes, and warehouse capacity maps.',
      'Corporate IT architecture blueprints, including server IP addresses, network topology data, and active directory structures.'
    ]
  }
];

interface DataRedactModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOptions: string[];
  onSelectionChange: (options: string[]) => void;
}

export const DataRedactModal: React.FC<DataRedactModalProps> = ({
  isOpen,
  onClose,
  selectedOptions,
  onSelectionChange,
}) => {
  const toggleOption = (id: string) => {
    if (selectedOptions.includes(id)) {
      onSelectionChange(selectedOptions.filter(opt => opt !== id));
    } else {
      onSelectionChange([...selectedOptions, id]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1a2256]">Configure Data Redact</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <p className="text-sm text-slate-600">
            Select the categories of sensitive data that should be redacted from the document during upload.
          </p>

          <div className="space-y-4">
            {REDACT_OPTIONS.map((option) => (
              <div 
                key={option.id}
                className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <Checkbox 
                  id={`redact-${option.id}`} 
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={() => toggleOption(option.id)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={`redact-${option.id}`}
                    className="text-sm font-bold leading-none text-[#1a2256] cursor-pointer"
                  >
                    {option.title}
                  </label>
                  <p className="text-sm text-slate-600 mt-1">
                    {option.description}
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-slate-500">
                    {option.examples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose} className="bg-[#64549f] hover:bg-[#524483] text-white rounded-xl">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
