'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowRight, Check, RotateCcw, User, Phone, Calendar, Wrench } from 'lucide-react';
import { PageHeader, Card, Button } from '@/components/boss/ui';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import type { BossCustomerData } from '@/types/boss-customer';

type Step = {
  key: 'name' | 'phone' | 'estimateDate' | 'workDate';
  label: string;
  sublabel: string;
  required: boolean;
  placeholder: string;
  maxLength: number;
  icon: typeof User;
};

const STEPS: Step[] = [
  {
    key: 'name',
    label: '고객명',
    sublabel: '고객명(필수)을 입력해주세요.',
    required: true,
    placeholder: '고객 이름',
    maxLength: 50,
    icon: User,
  },
  {
    key: 'phone',
    label: '전화번호',
    sublabel: '전화번호(선택)를 입력해주세요.',
    required: false,
    placeholder: '010 제외 숫자 8자리',
    maxLength: 9, // "1234 5678" includes space
    icon: Phone,
  },
  {
    key: 'estimateDate',
    label: '견적일',
    sublabel: '견적일(선택)을 입력해주세요.',
    required: false,
    placeholder: '12월26일 09시00분 → 1226 0900',
    maxLength: 9, // "MMDD HHMM" includes space
    icon: Calendar,
  },
  {
    key: 'workDate',
    label: '시공일',
    sublabel: '시공일(선택)을 입력해주세요.',
    required: false,
    placeholder: '12월26일 09시00분 → 1226 0900',
    maxLength: 9,
    icon: Wrench,
  },
];

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatPhone(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length > 8) return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
  if (digits.length > 4) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return digits;
}

function formatDateInput(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length > 8) return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
  if (digits.length > 4) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return digits;
}

function parseDate(raw: string): Date | null {
  const digits = onlyDigits(raw);
  if (digits.length !== 8) return null;

  const month = parseInt(digits.slice(0, 2), 10);
  const day = parseInt(digits.slice(2, 4), 10);
  const hour = parseInt(digits.slice(4, 6), 10);
  const minute = parseInt(digits.slice(6, 8), 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;

  const now = new Date();
  let year = now.getFullYear();
  let date = new Date(year, month - 1, day, hour, minute);

  // Match Flutter behavior: if the parsed date is before now, assume next year.
  if (date.getTime() < now.getTime()) {
    year += 1;
    date = new Date(year, month - 1, day, hour, minute);
  }

  // Validate day against actual month length
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return date;
}

function formatDateDisplay(raw: string): string {
  const date = parseDate(raw);
  if (!date) return raw;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}월 ${day}일 ${hour}:${minute}`;
}

function toBackendDate(raw: string): string {
  const date = parseDate(raw);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}`;
}

export default function QuickOrderPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<Step['key'], string>>({
    name: '',
    phone: '',
    estimateDate: '',
    workDate: '',
  });
  const [completedLabels, setCompletedLabels] = useState<{ key: Step['key']; label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStep = STEPS[currentIndex];
  const rawValue = answers[currentStep.key];
  const displayValue = useMemo(() => {
    if (currentStep.key === 'phone') return formatPhone(rawValue);
    if (currentStep.key === 'estimateDate' || currentStep.key === 'workDate') return formatDateInput(rawValue);
    return rawValue;
  }, [currentStep.key, rawValue]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const validateStep = useCallback((step: Step, value: string): string | null => {
    if (step.key === 'name') {
      if (!value.trim()) return '이름은 필수 입력값입니다.';
      return null;
    }
    if (step.key === 'phone') {
      if (!value.trim()) return null;
      const digits = onlyDigits(value);
      if (digits.length !== 8) return '전화번호는 8자리로 입력해주세요.';
      return null;
    }
    if (step.key === 'estimateDate' || step.key === 'workDate') {
      if (!value.trim()) return null;
      const digits = onlyDigits(value);
      if (digits.length !== 8) return '날짜와 시간을 올바른 형식으로 입력해주세요. (예: 1224 0900)';
      const date = parseDate(value);
      if (!date) return '날짜와 시간 형식이 올바르지 않습니다.';
      return null;
    }
    return null;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAnswers((prev) => ({ ...prev, [currentStep.key]: value }));
  };

  const goNext = useCallback(async () => {
    const error = validateStep(currentStep, rawValue);
    if (error) {
      toast.error(error);
      inputRef.current?.focus();
      return;
    }

    let displayAnswer = rawValue.trim();
    if (currentStep.key === 'phone' && displayAnswer) {
      const digits = onlyDigits(displayAnswer);
      displayAnswer = `010${digits}`;
    }
    if ((currentStep.key === 'estimateDate' || currentStep.key === 'workDate') && displayAnswer) {
      displayAnswer = formatDateDisplay(displayAnswer);
    }

    setCompletedLabels((prev) => {
      const next = [...prev];
      next[currentIndex] = { key: currentStep.key, label: currentStep.label, value: displayAnswer };
      return next;
    });

    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    // Final step: submit
    setLoading(true);
    try {
      const name = answers.name.trim();
      const phoneDigits = onlyDigits(answers.phone);
      const phone = phoneDigits ? `010${phoneDigits}` : '';
      const estimateDate = answers.estimateDate.trim() ? toBackendDate(answers.estimateDate) : '';
      const workDate = answers.workDate.trim() ? toBackendDate(answers.workDate) : '';

      const payload: BossCustomerData = {
        name,
        phone,
        estimateDate,
        workDate,
        email: '',
        post: '',
        address1: '',
        address2: '',
        memo: '',
        commonPw: '',
        housePw: '',
        companyId: 0,
      };

      const res = await bossCustomersApi.create(payload);
      if (res.success) {
        toast.success('퀵주문이 등록되었습니다.');
        router.push('/boss/orders');
      } else {
        toast.error(res.message || '퀵주문 등록에 실패했습니다.');
      }
    } catch {
      toast.error('퀵주문 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentIndex, currentStep, rawValue, answers, router, validateStep]);

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setCompletedLabels((prev) => prev.slice(0, -1));
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setAnswers({ name: '', phone: '', estimateDate: '', workDate: '' });
    setCompletedLabels([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="빠른 주문"
        description="고객 정보를 순서대로 입력하면 주문이 등록됩니다."
        actions={
          <Button variant="ghost" icon={RotateCcw} onClick={reset}>
            초기화
          </Button>
        }
      />

      <Card className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => {
            const done = idx < currentIndex;
            const active = idx === currentIndex;
            return (
              <div key={step.key} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : 'border border-slate-700 bg-slate-900/60 text-slate-500'
                  }`}
                >
                  {done ? <Check size={14} /> : idx + 1}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full ${
                      done ? 'bg-emerald-500/50' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Completed answers */}
        {completedLabels.length > 0 && (
          <div className="space-y-3 border-b border-slate-800 pb-5">
            {completedLabels.map((item) => (
              <div key={item.key} className="flex items-center gap-4">
                <span className="w-20 text-sm text-slate-500">{item.label}</span>
                <span className="flex-1 text-base font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Active input */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <currentStep.icon size={16} className="text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">{currentStep.sublabel}</span>
          </div>

          <input
            ref={inputRef}
            type={currentStep.key === 'name' ? 'text' : 'tel'}
            inputMode={currentStep.key === 'name' ? 'text' : 'numeric'}
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={currentStep.placeholder}
            maxLength={currentStep.maxLength}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 text-lg text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            autoComplete="off"
          />

          {currentStep.key !== 'name' && (
            <p className="text-xs text-slate-500">
              {currentStep.key === 'phone'
                ? '010을 제외한 8자리 숫자를 입력하세요.'
                : '월일과 시간을 8자리 숫자로 입력하세요. 예) 12월 26일 09:00 → 1226 0900'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="ghost" onClick={goBack} disabled={currentIndex === 0 || loading}>
            이전
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={currentIndex === STEPS.length - 1 ? Check : ArrowRight}
            onClick={goNext}
            disabled={loading}
          >
            {loading ? '등록 중…' : currentIndex === STEPS.length - 1 ? '완료' : '다음'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
