
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lightbulb, Send } from 'lucide-react';

interface AskGoodDocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestionDatabase = [
  'Increasing heart rate above baseline',
  'Blood pressure trending upward',
  'Temperature spike observed',
  'Patient appears restless',
  'Decreased oxygen saturation',
  'Pain level increasing',
  'Medication response noted',
  'Improved vital stability',
  'Patient more alert and responsive',
  'Decreased chest discomfort',
  'Normal cardiac rhythm maintained',
  'Respiratory effort improved'
];

export const AskGoodDocModal = ({ isOpen, onClose }: AskGoodDocModalProps) => {
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestions = useMemo(() => {
    if (!observation.trim() || observation.length < 3) return [];

    return suggestionDatabase
      .filter(suggestion =>
        suggestion.toLowerCase().includes(observation.toLowerCase())
      )
      .slice(0, 3);
  }, [observation]);

  const handleSubmit = async () => {
    if (!observation.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('New observation submitted:', observation);

    setIsSubmitting(false);
    setObservation('');
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setObservation(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Ask Good Doc
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div>
            <label className="block text-[14px] font-bold text-[#1a2256] mb-2">
              What would you like to observe or note?
            </label>
            <Input
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your observation (e.g., 'Increasing heart rate')"
              className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium pl-4 group-hover:border-[#64549f]/30"
              autoFocus
            />
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#64549f]" />
                <span className="text-[13px] font-bold text-[#1a2256]">Suggested observations:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer bg-[#f5f7fc] border-[#e0e3f5] hover:bg-[#64549f] hover:text-white hover:border-[#64549f] text-[12px] font-medium px-3 py-1.5 transition-all animate-in fade-in slide-in-from-left-1"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 rounded-b-[24px]">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-[12px] h-10 px-6 font-bold text-[#6e6868] border-[#e0e3f5] hover:bg-gray-50 transition-all active:scale-95 flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!observation.trim() || isSubmitting}
            className="rounded-[12px] h-10 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 flex-1"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
