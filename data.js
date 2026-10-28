// Sample dataset: marks per subject (0-100), attendance %, assignment %, semester results (%).
const SUBJECTS = [
  { id: 'DSA', credits: 4 }, { id: 'DBMS', credits: 3 },
  { id: 'OS', credits: 3 }, { id: 'MATHS', credits: 4 }
];
const STUDENTS = [
  { roll: '101', name: 'Aarav Sharma', sem: 3, marks: { DSA: 85, DBMS: 80, OS: 78, MATHS: 80 }, attendance: 92, assignment: 88, results: [74, 77, 81] },
  { roll: '102', name: 'Diya Verma',   sem: 3, marks: { DSA: 78, DBMS: 76, OS: 74, MATHS: 76 }, attendance: 90, assignment: 84, results: [70, 73, 76] },
  { roll: '103', name: 'Kabir Singh',  sem: 3, marks: { DSA: 74, DBMS: 70, OS: 72, MATHS: 72 }, attendance: 85, assignment: 80, results: [68, 70, 72] },
  { roll: '104', name: 'Meera Joshi',  sem: 3, marks: { DSA: 68, DBMS: 64, OS: 66, MATHS: 66 }, attendance: 78, assignment: 70, results: [60, 64, 66] },
  { roll: '105', name: 'Rohan Gupta',  sem: 3, marks: { DSA: 64, DBMS: 58, OS: 60, MATHS: 66 }, attendance: 74, assignment: 68, results: [66, 63, 62] },
  { roll: '106', name: 'Sana Khan',    sem: 3, marks: { DSA: 60, DBMS: 52, OS: 58, MATHS: 62 }, attendance: 70, assignment: 60, results: [55, 57, 58] },
  { roll: '107', name: 'Vikram Yadav', sem: 3, marks: { DSA: 48, DBMS: 42, OS: 45, MATHS: 45 }, attendance: 60, assignment: 50, results: [52, 48, 45] },
  { roll: '108', name: 'Isha Mishra',  sem: 3, marks: { DSA: 44, DBMS: 38, OS: 42, MATHS: 44 }, attendance: 55, assignment: 48, results: [48, 44, 42] },
  { roll: '109', name: 'Neha Tiwari',  sem: 3, marks: { DSA: 52, DBMS: 45, OS: 46, MATHS: 49 }, attendance: 62, assignment: 45, results: [44, 46, 48] },
  { roll: '110', name: 'Arjun Mehta',  sem: 3, marks: { DSA: 26, DBMS: 24, OS: 26, MATHS: 24 }, attendance: 35, assignment: 25, results: [34, 30, 25] },
  { roll: '111', name: 'Tara Nair',    sem: 3, marks: { DSA: 72, DBMS: 68, OS: 70, MATHS: 70 }, attendance: 95, assignment: 90, results: [66, 68, 70] },
  { roll: '112', name: 'Yash Pandey',  sem: 3, marks: { DSA: 90, DBMS: 88, OS: 82, MATHS: 80 }, attendance: 50, assignment: 40, results: [80, 84, 85] }
];
if (typeof module !== 'undefined') module.exports = { SUBJECTS, STUDENTS };
