import re

path = r'src\components\DoctorAssistantWidget.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# ─────────────────────────────────────────────
# 1. FONT STANDARDIZATION inside the modal
# ─────────────────────────────────────────────
replacements = [
    # Section titles
    ('text-[15px] font-bold text-[#1a2256] flex items-center gap-2', 'text-[14px] font-bold text-[#1a2256] flex items-center gap-2'),
    ('text-[17px] font-bold text-[#1a2256] flex items-center gap-3', 'text-[14px] font-bold text-[#1a2256] flex items-center gap-3'),
    # Textarea body text
    ('text-[14px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none', 'text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none'),
    # Primary table inputs
    ('text-[15px] font-bold text-[#1a2256] focus:ring-0 outline-none placeholder:font-normal placeholder:text-gray-300', 'text-[13px] font-bold text-[#1a2256] focus:ring-0 outline-none placeholder:font-normal placeholder:text-gray-300'),
    ('text-[14px] font-bold text-[#1a2256] focus:ring-0 outline-none placeholder:font-normal placeholder:text-gray-300', 'text-[13px] font-bold text-[#1a2256] focus:ring-0 outline-none placeholder:font-normal placeholder:text-gray-300'),
    ('text-[14px] font-bold text-[#1a2256] focus:ring-0 outline-none placeholder:text-gray-300', 'text-[13px] font-bold text-[#1a2256] focus:ring-0 outline-none placeholder:text-gray-300'),
    # Dropdown suggestion items
    ('"font-bold text-[14px]"', '"font-bold text-[13px]"'),
    # Notes italic inputs
    ('text-[14px] text-[#6e6868] italic focus:ring-0', 'text-[13px] text-[#6e6868] italic focus:ring-0'),
    # Add row buttons
    ('text-[13px] font-bold text-[#64549f] hover:bg-[#64549f]/5', 'text-[12px] font-bold text-[#64549f] hover:bg-[#64549f]/5'),
    # thead tr noise (font size already on th)
    (' text-[12px] font-bold text-[#1a2256]/50 uppercase tracking-wider', ''),
]

for old, new in replacements:
    content = content.replace(old, new)

# ─────────────────────────────────────────────
# 2. REPLACE deleteConfirmation onClick with DIRECT DELETE for prescriptions
# ─────────────────────────────────────────────
# Pattern: the onClick that opens the confirmation modal for medicines
old_rx_click = """onClick={() => {
                                                  setDeleteConfirmation({
                                                    type: 'medicine',
                                                    idx,
                                                    name: rx.name || 'this medicine',
                                                    dbId: rx.prescriptionId
                                                  });
                                                }}"""
new_rx_click = """onClick={() => {
                                                  const updated = consultForm.prescriptions.filter((_, i) => i !== idx);
                                                  setConsultForm(f => ({ ...f, prescriptions: updated }));
                                                }}"""
content = content.replace(old_rx_click, new_rx_click)

# Pattern: the onClick that opens the confirmation modal for lab orders
old_lab_click = """onClick={() => {
                                                  setDeleteConfirmation({
                                                    type: 'lab',
                                                    idx,
                                                    name: lab.testName || 'this lab order',
                                                    dbId: lab.labId
                                                  });
                                                }}"""
new_lab_click = """onClick={() => {
                                                  const updated = consultForm.labOrders.filter((_, i) => i !== idx);
                                                  setConsultForm(f => ({ ...f, labOrders: updated }));
                                                }}"""
content = content.replace(old_lab_click, new_lab_click)

# ─────────────────────────────────────────────
# 3. REMOVE the deleteConfirmation modal block entirely
# ─────────────────────────────────────────────
# Remove the entire JSX block for the confirmation modal
modal_pattern = re.compile(
    r'\s*\{/\* Custom Delete Confirmation Modal \*/\}\s*\{deleteConfirmation &&.*?\}\s*\)\s*\}',
    re.DOTALL
)
content = modal_pattern.sub('', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done: fonts standardized, direct delete wired, confirmation modal removed.')
