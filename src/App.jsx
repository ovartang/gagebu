import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("gagebu-data");
    return saved ? JSON.parse(saved) : {};
  });
  
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("지출");

  useEffect(() => {
    localStorage.setItem("gagebu-data", JSON.stringify(data));
  }, [data]);

  // --- CSV 내보내기 기능 추가 ---
  const exportToCSV = () => {
    // 1. 데이터 헤더 설정
    let csvContent = "\uFEFF"; // 한글 깨짐 방지용 코드
    csvContent += "날짜,구분,내용,금액\n";

    // 2. 전체 데이터를 돌면서 한 줄씩 생성
    Object.keys(data).sort().forEach((dateKey) => {
      data[dateKey].forEach((item) => {
        csvContent += `${dateKey},${item.type},${item.memo},${item.amount}\n`;
      });
    });

    // 3. 파일 다운로드 로직
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `가계부_백업_${currentYear}년${currentMonth+1}월.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const changeMonth = (offset) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    else if (newMonth < 0) { newMonth = 11; newYear--; }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
  };

  const handleSave = () => {
    if (!memo || !amount) return alert("내용과 금액을 입력해주세요!");
    const dateKey = `${currentYear}-${currentMonth + 1}-${selectedDate}일`; // 보기 편하게 날짜 형식 수정
    const newItem = { type, memo, amount: Number(amount) };
    const updatedDayData = data[dateKey] ? [...data[dateKey], newItem] : [newItem];
    setData({ ...data, [dateKey]: updatedDayData });
    setMemo("");
    setAmount("");
  };

  const deleteItem = (dateKey, index) => {
    const updatedDayData = data[dateKey].filter((_, i) => i !== index);
    const newData = { ...data, [dateKey]: updatedDayData };
    if (updatedDayData.length === 0) delete newData[dateKey];
    setData(newData);
  };

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dates = [];
  for (let i = 0; i < firstDay; i++) dates.push(null);
  for (let i = 1; i <= lastDate; i++) dates.push(i);

  const currentMonthKeys = Object.keys(data).filter(key => key.includes(`${currentYear}-${currentMonth + 1}-`));
  let totalIn = 0;
  let totalOut = 0;
  currentMonthKeys.forEach(key => {
    data[key].forEach(item => {
      if (item.type === "수익") totalIn += item.amount;
      else totalOut += item.amount;
    });
  });

  return (
    <div className="container">
      <div className="header">
        <button className="nav-btn" onClick={() => changeMonth(-1)}>◀</button>
        <h2>{currentYear}년 {currentMonth + 1}월 가계부</h2>
        <button className="nav-btn" onClick={() => changeMonth(1)}>▶</button>
      </div>

      <div className="calendar">
        {dates.map((d, i) => {
          const dateKey = `${currentYear}-${currentMonth + 1}-${d}일`;
          const dayItems = data[dateKey] || [];
          const dayIn = dayItems.filter(item => item.type === "수익").reduce((a, b) => a + b.amount, 0);
          const dayOut = dayItems.filter(item => item.type === "지출").reduce((a, b) => a + b.amount, 0);
          const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d;

          return (
            <div key={i} className={`day ${d === null ? "empty" : ""} ${isToday ? "today" : ""}`} onClick={() => d && setSelectedDate(d)}>
              <div className="date">{d}</div>
              {dayIn > 0 && <div className="income">+{dayIn}</div>}
              {dayOut > 0 && <div className="expense">-{dayOut}</div>}
            </div>
          );
        })}
      </div>

      <div className="summary">
        <div>수익: <span className="income">{totalIn}</span></div>
        <div>지출: <span className="expense">{totalOut}</span></div>
        <button className="backup-btn" onClick={exportToCSV}>💾 백업</button>
      </div>

      {selectedDate && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedDate}일 상세 내역</h3>
            <div className="input-group">
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="지출">지출</option>
                <option value="수익">수익</option>
              </select>
              <input placeholder="내용 (예: 점심)" value={memo} onChange={(e) => setMemo(e.target.value)} />
              <input type="number" placeholder="금액" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <button className="save-btn" onClick={handleSave}>추가</button>
            </div>
            <div className="item-list">
              {(data[`${currentYear}-${currentMonth + 1}-${selectedDate}일`] || []).map((item, idx) => (
                <div key={idx} className="item">
                  <span>{item.memo}</span>
                  <span className={item.type === "수익" ? "income" : "expense"}>{item.type === "수익" ? "+" : "-"}{item.amount}</span>
                  <button className="del-btn" onClick={() => deleteItem(`${currentYear}-${currentMonth + 1}-${selectedDate}일`, idx)}>x</button>
                </div>
              ))}
            </div>
            <button className="close-btn" onClick={() => setSelectedDate(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;