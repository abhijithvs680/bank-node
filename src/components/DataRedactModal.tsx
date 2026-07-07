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
}

export const REDACT_OPTIONS: RedactOption[] = [
  {
    id: 'pii',
    title: '1. PII Data',
    description: 'Personally Identifiable Information like SSN, names, addresses, and phone numbers.'
  },
  {
    id: 'ip',
    title: '2. Corporate IP & Trade Secrets',
    description: 'Proprietary source code, algorithms, business plans, and database schema logic.'
  },
  {
    id: 'pci',
    title: '3. Financial & PCI Data',
    description: 'Financial data like credit cards, bank routing numbers, and corporate ledgers.'
  },
  {
    id: 'internal',
    title: '4. Internal Operational Data',
    description: 'Internal records like supplier pricing agreements, vendor contracts, and IT architecture.'
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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1a2256]">Configure Data Redact</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <p className="text-sm text-slate-600 mb-4">
            Select the categories of sensitive data that should be redacted from the document during upload.
          </p>

          <div className="space-y-3">
            {REDACT_OPTIONS.map((option) => (
              <div 
                key={option.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <Checkbox 
                  id={`redact-${option.id}`} 
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={() => toggleOption(option.id)}
                  className="mt-1"
                />
                <div className="grid gap-1 leading-none">
                  <label
                    htmlFor={`redact-${option.id}`}
                    className="text-sm font-bold leading-none text-[#1a2256] cursor-pointer"
                  >
                    {option.title}
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose} className="bg-[#64549f] hover:bg-[#524483] text-white rounded-xl px-6">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
