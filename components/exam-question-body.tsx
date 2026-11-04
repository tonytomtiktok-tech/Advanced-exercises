'use client';
import {Question, getExplanationImages, getPromptImages, getPromptVideoUrl} from '@/lib/mock';
import {ExplanationImage, OptionImage, PromptImage, PromptVideo} from '@/components/question-media';
import MathText from '@/components/math-text';

const cls = (...x: (string | boolean | undefined)[]) => x.filter(Boolean).join(' ');

type Props = {
  q: Question;
  index: number;
  total: number;
  answer?: number;
  revealed: boolean;
  finished: boolean;
  practice: boolean;
  onChoose: (option: number) => void;
};

export default function ExamQuestionBody({
  q,
  index,
  total,
  answer,
  revealed,
  finished,
  practice,
  onChoose,
}: Props) {
  const locked = finished || (practice && revealed);

  return (
    <div className="overflow-hidden rounded-[28px] border bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/60 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-orange-100 bg-white font-bold text-orange-500">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            คำถามที่ {index + 1} จาก {total}
          </span>
        </div>
      </div>
      <div className="p-6 sm:p-9">
        <MathText
          as="h2"
          className="text-lg font-bold leading-9 text-ink sm:text-xl"
          text={
            q.prompt ||
            (getPromptImages(q).length || getPromptVideoUrl(q)
              ? 'พิจารณาสื่อต่อไปนี้แล้วตอบคำถาม'
              : '')
          }
        />
        <PromptImage images={getPromptImages(q)} />
        <PromptVideo url={getPromptVideoUrl(q)} />

        <div className="mt-7 flex flex-col gap-3">
          {q.options.map((option, i) => {
            const selected = answer === i;
            const right = revealed && i === q.correct;
            const wrong = revealed && selected && i !== q.correct;
            const letter = String.fromCharCode(65 + i);
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => onChoose(i)}
                className={cls(
                  'w-full rounded-2xl border px-4 py-4 text-left transition',
                  right && 'border-emerald-400 bg-emerald-50',
                  wrong && 'border-rose-300 bg-rose-50',
                  !right && !wrong && selected && 'border-brand bg-indigo-50',
                  !right && !wrong && !selected && 'border-slate-200 bg-white hover:border-indigo-200',
                  locked && 'cursor-default',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cls(
                      'grid h-8 min-w-8 shrink-0 place-items-center rounded-full px-2 text-xs font-black',
                      right && 'bg-emerald-500 text-white',
                      wrong && 'bg-rose-500 text-white',
                      !right && !wrong && selected && 'bg-brand text-white',
                      !right && !wrong && !selected && 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {right ? '✓' : wrong ? '✗' : `${letter}.`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <MathText
                      as="div"
                      className="text-sm font-semibold leading-6 text-ink"
                      text={
                        option || (q.optionImages?.[i] ? 'ดูภาพประกอบ' : `ตัวเลือก ${letter}`)
                      }
                    />
                    <OptionImage src={q.optionImages?.[i]} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
            <p className="font-bold text-brand">
              {answer === q.correct ? '✓ ตอบถูกต้อง!' : 'เฉลยและแนวคิด'}
            </p>
            <div className="mt-3 text-sm font-bold text-ink">
              คำตอบที่ถูกต้อง: {String.fromCharCode(65 + q.correct)}
              {q.options[q.correct] ? (
                <>
                  {' — '}
                  <MathText text={q.options[q.correct]} />
                </>
              ) : null}
            </div>
            <OptionImage src={q.optionImages?.[q.correct]} />
            {q.explanation && (
              <MathText
                as="div"
                className="mt-3 text-sm leading-7 text-slate-600"
                text={q.explanation}
              />
            )}
            <ExplanationImage images={getExplanationImages(q)} />
          </div>
        )}
      </div>
    </div>
  );
}
