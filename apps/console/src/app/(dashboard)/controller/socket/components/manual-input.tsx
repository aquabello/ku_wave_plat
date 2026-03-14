'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ManualInputProps {
  disabled: boolean;
  onSend: (command: string, format: 'HEX' | 'TEXT') => void;
}

export function ManualInput({ disabled, onSend }: ManualInputProps) {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<'HEX' | 'TEXT'>('HEX');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim(), format);
    setInput('');
  };

  return (
    <div className="flex gap-2 items-center">
      <Tabs value={format} onValueChange={(v) => setFormat(v as 'HEX' | 'TEXT')}>
        <TabsList className="h-9">
          <TabsTrigger value="HEX" className="text-xs">HEX</TabsTrigger>
          <TabsTrigger value="TEXT" className="text-xs">TEXT</TabsTrigger>
        </TabsList>
      </Tabs>
      <Input
        className="font-mono"
        placeholder={format === 'HEX' ? 'EE B1 11 00 ...' : 'RECORDER ON'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        disabled={disabled}
      />
      <Button onClick={handleSend} disabled={disabled || !input.trim()}>
        전송
      </Button>
    </div>
  );
}
