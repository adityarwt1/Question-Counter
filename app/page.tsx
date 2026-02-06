"use client";

import { SubjectInterface } from "@/interface/Subject/Subject";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";

type CountType = keyof Pick<
  SubjectInterface,
  "dppCount" | "classCount" | "pyqCount" | "bookCount" | "chatGptCount"
>;

// Skeleton Loader Component
const SubjectCardSkeleton = () => {
  return (
    <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-6 bg-zinc-700 rounded w-32"></div>
        <div className="h-6 bg-zinc-700 rounded w-8"></div>
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex justify-between items-center mt-2">
          <div className="h-5 bg-zinc-700 rounded w-20"></div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-zinc-700 rounded"></div>
            <div className="w-8 h-8 bg-zinc-700 rounded"></div>
            <div className="w-8 h-8 bg-zinc-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SkeletonLoader = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SubjectCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default function SubjectPage() {
  const [subjects, setSubjects] = useState<SubjectInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  // Debounce tracking
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingUpdates = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, []);

  /* ---------------- CALCULATE TOTAL QUESTIONS FROM SUBJECTS ---------------- */
  const calculateTotalQuestions = (subjectsList: SubjectInterface[]): number => {
    return subjectsList.reduce((total, subject) => {
      return total + 
        subject.dppCount + 
        subject.classCount + 
        subject.pyqCount + 
        subject.bookCount + 
        subject.chatGptCount;
    }, 0);
  };

  const totalQuestion = calculateTotalQuestions(subjects);

  /* ---------------- CALCULATE SUBJECT TOTAL ---------------- */
  const getSubjectTotal = (subject: SubjectInterface): number => {
    return subject.dppCount + 
           subject.classCount + 
           subject.pyqCount + 
           subject.bookCount + 
           subject.chatGptCount;
  };

  /* ---------------- FETCH SUBJECTS ---------------- */
  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem(
        process.env.NEXT_PUBLIC_COOKIE_NAME as string
      );

      if (!token) return router.replace("/signin");

      const res = await fetch("/api/v1/subject", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if(res.status === 401) {
        return router.replace("/signin");
      }
      const data = await res.json();
      setSubjects(data.subjects || []);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- DEBOUNCED API CALL ---------------- */
  const executeApiUpdate = async (subjectId: string, type: CountType, count: number) => {
    try {
      const token = localStorage.getItem(
        process.env.NEXT_PUBLIC_COOKIE_NAME as string
      );

      const action = count > 0 ? 'increment' : 'decrement';
      const absoluteCount = Math.abs(count);

      const res = await fetch(
        `/api/v1/incAndDcs?_id=${subjectId}&type=${type}&action=${action}&count=${absoluteCount}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update');
      
      return true;
    } catch (err) {
      console.error('API Update Error:', err);
      return false;
    }
  };

  /* ---------------- DEBOUNCED COUNT CHANGE ---------------- */
  const handleCountChange = useCallback((subjectId: string, type: CountType, delta: number) => {
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return;

    // Don't allow decrement below 0
    const newValue = subject[type] + delta;
    if (newValue < 0) return;

    // ⭐ IMMEDIATE OPTIMISTIC UI UPDATE
    setSubjects(prev =>
      prev.map(s =>
        s._id === subjectId ? { ...s, [type]: newValue } : s
      )
    );

    // ⭐ DEBOUNCED API CALL
    const key = `${subjectId}-${type}`;
    
    // Clear existing timer for this subject-type combination
    const existingTimer = debounceTimers.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Track pending updates (accumulate deltas)
    const currentPending = pendingUpdates.current.get(key) || 0;
    const newPending = currentPending + delta;
    pendingUpdates.current.set(key, newPending);

    // Set new debounce timer (500ms delay)
    const timer = setTimeout(async () => {
      const pendingDelta = pendingUpdates.current.get(key);
      if (pendingDelta !== undefined && pendingDelta !== 0) {
        const success = await executeApiUpdate(subjectId, type, pendingDelta);
        
        if (!success) {
          // ❌ ROLLBACK on failure
          setSubjects(prev =>
            prev.map(s =>
              s._id === subjectId ? { ...s, [type]: s[type] - pendingDelta } : s
            )
          );
          setError(`Failed to ${pendingDelta > 0 ? 'increment' : 'decrement'} ${type}`);
          
          // Auto-clear error after 3 seconds
          setTimeout(() => setError(''), 3000);
        }
        
        pendingUpdates.current.delete(key);
      }
      debounceTimers.current.delete(key);
    }, 500);

    debounceTimers.current.set(key, timer);
  }, [subjects]);

  const handleIncrement = (subjectId: string, type: CountType) => {
    handleCountChange(subjectId, type, 1);
  };

  const handleDecrement = (subjectId: string, type: CountType) => {
    handleCountChange(subjectId, type, -1);
  };

  /* ---------------- ADD SUBJECT ---------------- */
  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;

    setIsAdding(true);
    try {
      const token = localStorage.getItem(
        process.env.NEXT_PUBLIC_COOKIE_NAME as string
      );
      if (!token) return router.replace("/signin");

      const res = await fetch("/api/v1/subject", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subjectName: newSubjectName }),
      });
    
      if(res.status === 401) {
        return router.replace("/signin");
      }
      const data = await res.json();
      if (!data.success) throw new Error();

      setShowAddModal(false);
      setNewSubjectName("");
      fetchSubjects(); // Refresh subjects
    } catch {
      setError("Failed to add subject");
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-200">
            My Subjects
          </h1>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 rounded-lg font-medium bg-zinc-200 text-zinc-900 hover:opacity-90 transition-opacity"
          >
            + Add Subject
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center text-zinc-200 mb-6">
          Total Questions: {Number(totalQuestion).toLocaleString()}/15,000
        </h1>

        {/* Overall Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="w-full bg-zinc-700 rounded-full h-3">
            <div
              className="bg-[#e0e0e0] h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((Number(totalQuestion) / 15000) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-center text-zinc-300 text-sm mt-2">
            Overall Progress: {((Number(totalQuestion) / 15000) * 100).toFixed(1)}%
          </div>
        </div>

        {/* Add Subject Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-md border border-zinc-700">
              <h2 className="text-xl font-semibold text-zinc-200 mb-4">
                Add New Subject
              </h2>

              <input
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded mb-4 text-zinc-200 focus:border-zinc-500 outline-none"
                placeholder="e.g. Physics"
                disabled={isAdding}
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewSubjectName("");
                  }}
                  className="flex-1 py-2 bg-zinc-700 rounded text-zinc-200 hover:bg-zinc-600 transition-colors"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubject}
                  disabled={isAdding || !newSubjectName.trim()}
                  className="flex-1 py-2 bg-zinc-200 text-zinc-900 rounded hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subjects Grid */}
        {isLoading ? (
          <SkeletonLoader count={6} />
        ) : subjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">No subjects yet. Add your first subject to get started!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-lg font-medium bg-zinc-200 text-zinc-900 hover:opacity-90"
            >
              + Add Your First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.map(subject => (
              <div
                key={subject._id}
                className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
              >
                <div className="flex justify-between mb-3">
                  <h3 className="text-xl text-zinc-200 font-semibold">
                    {subject.subjectName}
                  </h3>
                  <span className="text-zinc-400 font-medium">
                    {getSubjectTotal(subject)}
                  </span>
                </div>

                {(["dppCount", "classCount", "pyqCount", "bookCount", "chatGptCount"] as CountType[]).map(
                  type => (
                    <CounterRow
                      key={type}
                      label={type.replace("Count", "").toUpperCase()}
                      count={subject[type]}
                      onIncrement={() => handleIncrement(subject._id, type)}
                      onDecrement={() => handleDecrement(subject._id, type)}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="text-white hover:text-gray-200 font-bold text-xl"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ---------------- COUNTER ROW ---------------- */

function CounterRow({
  label,
  count,
  onIncrement,
  onDecrement,
}: {
  label: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex justify-between items-center mt-2">
      <span className="text-zinc-400 text-sm">{label}</span>
      <div className="flex gap-2 items-center">
        <button 
          onClick={onDecrement} 
          className="px-3 py-1 bg-zinc-700 rounded hover:bg-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={count <= 0}
        >
          −
        </button>
        <span className="w-10 text-center text-zinc-200 font-medium">{count}</span>
        <button 
          onClick={onIncrement} 
          className="px-3 py-1 bg-zinc-700 rounded hover:bg-zinc-600 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}