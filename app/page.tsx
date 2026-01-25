"use client";

import { SubjectInterface } from "@/interface/Subject/Subject";
import { SubjectAndQuestionCount } from "@/interface/Summary/totalQuestion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CountType = keyof Pick<
  SubjectInterface,
  "dppCount" | "classCount" | "pyqCount" | "bookCount" | "chatGptCount"
>;

export default function SubjectPage() {
  const [subjects, setSubjects] = useState<SubjectInterface[]>([]);
  const [summaryData, setSummaryData] = useState<SubjectAndQuestionCount[]>([]);
  const [totalQuestion, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSubjects();
    fetchSummary();
  }, []);

  /* ---------------- FETCH SUMMARY ---------------- */

  const fetchSummary = async () => {
    const token = localStorage.getItem(
      process.env.NEXT_PUBLIC_COOKIE_NAME as string
    );

    if (!token) return router.replace("/signin");

    const res = await fetch("/api/v1/questionCount", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if(res.status === 401) {
      return router.replace("/signin");
    }
    const data = await res.json();

    setSummaryData(data.subjects[0].subjects || []);
    setTotalQuestions(data.subjects[0].total[0]?.totalCount || 0);
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

  /* ---------------- SUMMARY UPDATE HELPERS ---------------- */

  // ⭐ NEW
  const updateSummary = (subjectName: string, delta: number) => {
    setSummaryData(prev =>
      prev.map(s =>
        s.subjectName === subjectName
          ? { ...s, count: s.count + delta }
          : s
      )
    );
    setTotalQuestions(prev => prev + delta);
  };

  /* ---------------- INCREMENT ---------------- */

  const handleIncrement = async (subjectId: string, type: CountType) => {
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return;

    // ⭐ OPTIMISTIC UI
    setSubjects(prev =>
      prev.map(s =>
        s._id === subjectId ? { ...s, [type]: s[type] + 1 } : s
      )
    );
    updateSummary(subject.subjectName, +1);

    try {
      const token = localStorage.getItem(
        process.env.NEXT_PUBLIC_COOKIE_NAME as string
      );

      const res = await fetch(
        `/api/v1/incAndDcs?_id=${subjectId}&type=${type}&action=increment`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error();
    } catch {
      // ❌ ROLLBACK
      setSubjects(prev =>
        prev.map(s =>
          s._id === subjectId ? { ...s, [type]: s[type] - 1 } : s
        )
      );
      updateSummary(subject.subjectName, -1);
      setError("Failed to increment");
    }
  };

  /* ---------------- DECREMENT ---------------- */

  const handleDecrement = async (subjectId: string, type: CountType) => {
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject || subject[type] <= 0) return;

    // ⭐ OPTIMISTIC UI
    setSubjects(prev =>
      prev.map(s =>
        s._id === subjectId ? { ...s, [type]: s[type] - 1 } : s
      )
    );
    updateSummary(subject.subjectName, -1);

    try {
      const token = localStorage.getItem(
        process.env.NEXT_PUBLIC_COOKIE_NAME as string
      );

      const res = await fetch(
        `/api/v1/incAndDcs?_id=${subjectId}&type=${type}&action=decrement`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error();
    } catch {
      // ❌ ROLLBACK
      setSubjects(prev =>
        prev.map(s =>
          s._id === subjectId ? { ...s, [type]: s[type] + 1 } : s
        )
      );
      updateSummary(subject.subjectName, +1);
      setError("Failed to decrement");
    }
  };

  /* ---------------- UI ---------------- */

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
    fetchSubjects();      // subjects refresh
    fetchSummary();       // summary refresh
  } catch {
    setError("Failed to add subject");
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
      className="px-6 py-3 rounded-lg font-medium bg-zinc-200 text-zinc-900 hover:opacity-90"
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

    {showAddModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-md border border-zinc-700">
      <h2 className="text-xl font-semibold text-zinc-200 mb-4">
        Add New Subject
      </h2>

      <input
        value={newSubjectName}
        onChange={e => setNewSubjectName(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded mb-4 text-zinc-200"
        placeholder="e.g. Physics"
        disabled={isAdding}
      />

      <div className="flex gap-3">
        <button
          onClick={() => setShowAddModal(false)}
          className="flex-1 py-2 bg-zinc-700 rounded text-zinc-200"
        >
          Cancel
        </button>
        <button
          onClick={handleAddSubject}
          disabled={isAdding}
          className="flex-1 py-2 bg-zinc-200 text-zinc-900 rounded"
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  </div>
)}

        {isLoading ? (
          <p className="text-center text-zinc-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.map(subject => (
              <div
                key={subject._id}
                className="bg-zinc-800 p-5 rounded-lg border border-zinc-700"
              >
                <div className="flex justify-between mb-3">
                  <h3 className="text-xl text-zinc-200">
                    {subject.subjectName}
                  </h3>
                  <span className="text-zinc-400">
                    {
                      summaryData.find(
                        s => s.subjectName === subject.subjectName
                      )?.count ?? 0
                    }
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
      </div>
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
      <span className="text-zinc-400">{label}</span>
      <div className="flex gap-2">
        <button onClick={onDecrement} className="px-2 bg-zinc-700 rounded">
          −
        </button>
        <span className="w-8 text-center text-zinc-200">{count}</span>
        <button onClick={onIncrement} className="px-2 bg-zinc-700 rounded">
          +
        </button>
      </div>
    </div>
  );
}
