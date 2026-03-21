import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, UserCheck, Calendar, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestView() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[] | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact) {
      setError('이름과 연락처를 모두 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/guest/attendance?name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceData(data.attendance);
        setStudentName(data.studentName);
      } else {
        const err = await res.json();
        setError(err.error || '조회에 실패했습니다.');
      }
    } catch (e) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
            <UserCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">비회원 출석 조회</h1>
            <p className="text-xs text-slate-500 font-medium">체키 에듀 원생 출석 기록</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-6 space-y-6">
        {!attendanceData ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">출석 기록 조회</h2>
              <p className="text-slate-500">원생 이름과 등록된 학부모 연락처를 입력해주세요.</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">원생 이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">학부모 연락처</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-bold text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 mt-4"
              >
                {isSearching ? '조회 중...' : '조회하기'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{studentName || name} 학생의 출석 기록</h2>
              <button 
                onClick={() => {
                  setAttendanceData(null);
                  setStudentName(null);
                }}
                className="text-sm font-bold text-orange-500 hover:text-orange-600"
              >
                다시 검색
              </button>
            </div>

            {attendanceData.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">최근 30일간의 출석 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceData.map((record: any) => (
                  <div key={record.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        record.activity_type === 'in' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                      }`}>
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                            record.activity_type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {record.activity_type === 'in' ? '등원' : '하원'}
                          </span>
                          <span className="text-lg font-black text-slate-800">
                            {new Date(record.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(record.timestamp).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                        </div>
                      </div>
                    </div>
                    {record.place && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-slate-500 justify-end mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>{record.place.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
