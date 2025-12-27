"use client"
import { GetSubjectInterface, SubjectInterface } from '@/interface/Subject/Subject';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SubjectPage() {
  const [subjects, setSubjects] = useState<SubjectInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  // Fetch subjects on component mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string) || ""

      if(!token){
        router.replace('/signin')
        return 
      }
      const response = await fetch('/api/v1/subject', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(data)
      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to fetch subjects');
      }

      setSubjects(data.subjects || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string) 

      if(!token){
        router.replace('/signin')
        return 
      }
      const response = await fetch('/api/v1/subject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subjectName: newSubjectName }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add subject');
      }

      setNewSubjectName('');
      setShowAddModal(false);
      fetchSubjects();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = async (subjectId: string, type: keyof Pick<SubjectInterface, 'dppCount' | 'classCount' | 'pyqCount' | 'bookCount' | 'chatGptCount'>) => {
    // Optimistic update - increment in frontend first
    setSubjects(prevSubjects => 
      prevSubjects.map(subject => 
        subject._id === subjectId 
          ? { ...subject, [type]: subject[type] + 1 }
          : subject
      )
    );

    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string);

      if (!token) {
        router.replace('/signin');
        return;
      }

      const response = await fetch(`/api/v1/incAndDcs?_id=${subjectId}&type=${type}&action=increment`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Rollback on failure - decrement back
        setSubjects(prevSubjects => 
          prevSubjects.map(subject => 
            subject._id === subjectId 
              ? { ...subject, [type]: subject[type] - 1 }
              : subject
          )
        );
        setError(data.error || 'Failed to update count');
      }
    } catch (err) {
      // Rollback on error - decrement back
      setSubjects(prevSubjects => 
        prevSubjects.map(subject => 
          subject._id === subjectId 
            ? { ...subject, [type]: subject[type] - 1 }
            : subject
        )
      );
      setError((err as Error).message);
    }
  };

  const handleDecrement = async (subjectId: string, type: keyof Pick<SubjectInterface, 'dppCount' | 'classCount' | 'pyqCount' | 'bookCount' | 'chatGptCount'>) => {
    // Get current value to prevent negative numbers
    const currentSubject = subjects.find(s => s._id === subjectId);
    if (!currentSubject || currentSubject[type] <= 0) {
      return; // Don't decrement if already at 0
    }

    // Optimistic update - decrement in frontend first
    setSubjects(prevSubjects => 
      prevSubjects.map(subject => 
        subject._id === subjectId 
          ? { ...subject, [type]: subject[type] - 1 }
          : subject
      )
    );

    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string);

      if (!token) {
        router.replace('/signin');
        return;
      }

      const response = await fetch(`/api/v1/incAndDcs?_id=${subjectId}&type=${type}&action=decrement`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Rollback on failure - increment back
        setSubjects(prevSubjects => 
          prevSubjects.map(subject => 
            subject._id === subjectId 
              ? { ...subject, [type]: subject[type] + 1 }
              : subject
          )
        );
        setError(data.error || 'Failed to update count');
      }
    } catch (err) {
      // Rollback on error - increment back
      setSubjects(prevSubjects => 
        prevSubjects.map(subject => 
          subject._id === subjectId 
            ? { ...subject, [type]: subject[type] + 1 }
            : subject
        )
      );
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#e0e0e0' }}>
            My Subjects
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: '#e0e0e0', color: '#18181b' }}
          >
            + Add Subject
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-8 w-8" style={{ color: '#e0e0e0' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">No subjects yet. Add your first subject!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject: SubjectInterface) => (
              <div key={subject._id} className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#e0e0e0' }}>
                  {subject.subjectName}
                </h3>
                
                <div className="space-y-3">
                  <CounterRow 
                    label="DPP"
                    count={subject.dppCount}
                    onIncrement={() => handleIncrement(subject._id, 'dppCount')}
                    onDecrement={() => handleDecrement(subject._id, 'dppCount')}
                  />
                  <CounterRow 
                    label="Class"
                    count={subject.classCount}
                    onIncrement={() => handleIncrement(subject._id, 'classCount')}
                    onDecrement={() => handleDecrement(subject._id, 'classCount')}
                  />
                  <CounterRow 
                    label="PYQ"
                    count={subject.pyqCount}
                    onIncrement={() => handleIncrement(subject._id, 'pyqCount')}
                    onDecrement={() => handleDecrement(subject._id, 'pyqCount')}
                  />
                  <CounterRow 
                    label="Book"
                    count={subject.bookCount}
                    onIncrement={() => handleIncrement(subject._id, 'bookCount')}
                    onDecrement={() => handleDecrement(subject._id, 'bookCount')}
                  />
                  <CounterRow 
                    label="ChatGPT"
                    count={subject.chatGptCount}
                    onIncrement={() => handleIncrement(subject._id, 'chatGptCount')}
                    onDecrement={() => handleDecrement(subject._id, 'chatGptCount')}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md border border-zinc-700">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#e0e0e0' }}>
                Add New Subject
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isAdding && handleAddSubject()}
                  disabled={isAdding}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all disabled:opacity-50"
                  style={{ color: '#e0e0e0' }}
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewSubjectName('');
                    setError('');
                  }}
                  disabled={isAdding}
                  className="flex-1 px-4 py-3 bg-zinc-700 rounded-lg font-medium transition-all hover:bg-zinc-600 disabled:opacity-50"
                  style={{ color: '#e0e0e0' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubject}
                  disabled={isAdding}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#e0e0e0', color: '#18181b' }}
                >
                  {isAdding ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CounterRowProps {
  label: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function CounterRow({ label, count, onIncrement, onDecrement }: CounterRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={onDecrement}
          className="w-8 h-8 flex items-center justify-center bg-zinc-700 rounded hover:bg-zinc-600 transition-all"
          style={{ color: '#e0e0e0' }}
        >
          −
        </button>
        <span className="w-12 text-center font-medium" style={{ color: '#e0e0e0' }}>
          {count}
        </span>
        <button
          onClick={onIncrement}
          className="w-8 h-8 flex items-center justify-center bg-zinc-700 rounded hover:bg-zinc-600 transition-all"
          style={{ color: '#e0e0e0' }}
        >
          +
        </button>
      </div>
    </div>
  );
}