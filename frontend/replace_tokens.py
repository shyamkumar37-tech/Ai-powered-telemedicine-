import os
import glob

pages_dir = r'c:\Users\shyamkumar\Desktop\oose pro\frontend\src\pages'

doctor_files = glob.glob(os.path.join(pages_dir, 'Doctor*.jsx'))
caregiver_files = glob.glob(os.path.join(pages_dir, 'Caregiver*.jsx'))
pharmacist_files = glob.glob(os.path.join(pages_dir, 'Pharmacist*.jsx'))

all_files = doctor_files + caregiver_files + pharmacist_files

replacements = {
    'import "./doctor-premium-override.css";\n': '',
    'import "./caregiver-premium-override.css";\n': '',
    'import "./pharmacist-premium-override.css";\n': '',
    'doc-premium-layout': 'min-h-screen bg-[var(--tc-bg)] text-[var(--tc-text)]',
    'doc-card-elevated': 'glass-card',
    'doc-card': 'glass-card',
    'doc-btn-primary': 'btn-primary',
    'doc-btn-secondary': 'btn-secondary',
    'doc-btn-danger': 'btn-danger',
    'doc-btn-ghost': 'btn-ghost',
    'doc-btn': 'btn-primary',
    'doc-badge-success': 'tc-badge tc-badge-success',
    'doc-badge-warn': 'tc-badge tc-badge-warning',
    'doc-badge-alert': 'tc-badge tc-badge-danger',
    'doc-badge-neutral': 'tc-badge tc-badge-neutral',
    'doc-badge-accent': 'tc-badge tc-badge-primary',
    'doc-badge': 'tc-badge',
    'doc-input': 'field',
    'doc-grid-2': 'grid gap-6 md:grid-cols-2',
    'doc-grid-3': 'grid gap-6 md:grid-cols-3 xl:grid-cols-4',
    
    # caregiver
    'caregiver-premium-layout': 'min-h-screen bg-[var(--tc-bg)] text-[var(--tc-text)]',
    'caregiver-card-elevated': 'glass-card',
    'caregiver-card': 'glass-card',
    'caregiver-btn-primary': 'btn-primary',
    'caregiver-btn-secondary': 'btn-secondary',
    'caregiver-btn-danger': 'btn-danger',
    'caregiver-btn-ghost': 'btn-ghost',
    'caregiver-btn': 'btn-primary',
    'caregiver-badge-success': 'tc-badge tc-badge-success',
    'caregiver-badge-warn': 'tc-badge tc-badge-warning',
    'caregiver-badge-alert': 'tc-badge tc-badge-danger',
    'caregiver-badge-neutral': 'tc-badge tc-badge-neutral',
    'caregiver-badge-accent': 'tc-badge tc-badge-primary',
    'caregiver-badge': 'tc-badge',
    'caregiver-input': 'field',
    'caregiver-grid-2': 'grid gap-6 md:grid-cols-2',
    'caregiver-grid-3': 'grid gap-6 md:grid-cols-3 xl:grid-cols-4',
    
    # pharmacist
    'pharma-premium-layout': 'min-h-screen bg-[var(--tc-bg)] text-[var(--tc-text)]',
    'pharma-card-elevated': 'glass-card',
    'pharma-card': 'glass-card',
    'pharma-btn-primary': 'btn-primary',
    'pharma-btn-secondary': 'btn-secondary',
    'pharma-btn-danger': 'btn-danger',
    'pharma-btn-ghost': 'btn-ghost',
    'pharma-btn': 'btn-primary',
    'pharma-badge-success': 'tc-badge tc-badge-success',
    'pharma-badge-warn': 'tc-badge tc-badge-warning',
    'pharma-badge-alert': 'tc-badge tc-badge-danger',
    'pharma-badge-neutral': 'tc-badge tc-badge-neutral',
    'pharma-badge-accent': 'tc-badge tc-badge-primary',
    'pharma-badge': 'tc-badge',
    
    # common
    'text-ink-muted': 'text-[var(--tc-text-muted)]',
    'text-ink/90': 'text-[var(--tc-text-secondary)]',
    'text-ink/70': 'text-[var(--tc-text-soft)]',
    'text-ink': 'text-[var(--tc-text)]',
    'bg-white/5 border border-white/10': 'bg-[var(--tc-surface)] border border-[var(--tc-border)]',
    'bg-white/5': 'bg-[var(--tc-surface-muted)]',
    'border-white/10': 'border-[var(--tc-border)]',
    'border-white/20': 'border-[var(--tc-border-strong)]',
}

for file_path in all_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f'Updated {len(all_files)} pages.')
