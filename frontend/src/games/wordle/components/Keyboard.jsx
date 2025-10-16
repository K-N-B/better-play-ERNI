import "./Keyboard.css";

const Keyboard = ({ onKeyPress, guesses, solution, activeKey }) => {
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "BACKSPACE"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "ENTER"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const getKeyStatus = (key) => {
    if (key === "ENTER" || key === "BACKSPACE") return "";

    let status = "";

    for (const guess of guesses) {
      if (!guess) continue;

      for (let i = 0; i < guess.length; i += 1) {
        if (guess[i] === key) {
          if (solution[i] === key) {
            return "correct";
          }
          if (solution.includes(key)) {
            status = "present";
          } else if (status !== "present") {
            status = "absent";
          }
        }
      }
    }

    return status;
  };

  const buildKeyClassName = (key) => {
    const classes = ["key"];
    if (key.length > 1) classes.push("key-large");
    const status = getKeyStatus(key);
    if (status) classes.push(status);
    if (activeKey === key) classes.push("active");
    return classes.join(" ");
  };

  return (
    <div className="keyboard">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key) => (
            <button
              key={key}
              className={buildKeyClassName(key)}
              onClick={() => onKeyPress(key)}
            >
              {key === "BACKSPACE" ? "Backspace" : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
