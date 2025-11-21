// Function to clean the text (remove white spaces and what not)
const cleanText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


// Classical NLP to detect food from predermined food list
const detectFoods = (transcript, foodList) => {
  const text = cleanText(transcript);

  const detected = [];

  for (const food of foodList) {
    const f = food.toLowerCase();
    if (text.includes(f)) {
      detected.push(food);
    }
  }

  // // Remove duplicates (case-insensitive)
  // const unique = [...new Set(detected.map(f => f.toLowerCase()))];
  
  // return unique;
  return detected;
}

export { detectFoods };