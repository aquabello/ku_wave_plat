'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface UserAssignment {
  tuSeq: number;
  isDefault: 'Y' | 'N';
}

interface UserAssignmentFieldProps {
  value: UserAssignment[];
  onChange: (value: UserAssignment[]) => void;
}

export function UserAssignmentField({
  value,
  onChange,
}: UserAssignmentFieldProps) {
  const handleAdd = () => {
    onChange([...value, { tuSeq: 0, isDefault: 'N' }]);
  };

  const handleRemove = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleTuSeqChange = (index: number, tuSeq: number) => {
    const next = value.map((item, i) =>
      i === index ? { ...item, tuSeq } : item,
    );
    onChange(next);
  };

  const handleDefaultChange = (index: number, checked: boolean) => {
    const next = value.map((item, i) => ({
      ...item,
      isDefault: (i === index && checked ? 'Y' : 'N') as 'Y' | 'N',
    }));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">배정 사용자</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          추가
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          배정된 사용자가 없습니다.
        </p>
      )}

      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="사용자 번호 (tuSeq)"
              value={item.tuSeq || ''}
              onChange={(e) =>
                handleTuSeqChange(index, Number(e.target.value) || 0)
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`default-${index}`}
              checked={item.isDefault === 'Y'}
              onCheckedChange={(checked) =>
                handleDefaultChange(index, checked === true)
              }
            />
            <Label htmlFor={`default-${index}`} className="text-sm">
              기본
            </Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(index)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ))}
    </div>
  );
}
