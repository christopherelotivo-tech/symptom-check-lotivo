const fs = require('fs');
const rules = JSON.parse(fs.readFileSync('src/database/seedRules.json', 'utf8'));

// Helper to generate some specific text based on description
for (let r of rules) {
  const desc = r.metadata.description.toLowerCase();
  
  if (r.metadata.riskCategory === 'Red') {
    if (desc.includes('heart') || desc.includes('cardiac')) {
      r.metadata.selfCareAdvice = 'Keep the person calm, seated, and resting. Loosen any tight clothing.';
      r.metadata.medicationAdvice = 'Do not take anything by mouth unless previously prescribed nitroglycerin by a doctor for this exact situation.';
      r.metadata.escalationTrigger = 'This is a life-threatening medical emergency. Call 911 immediately without delay.';
    } else if (desc.includes('stroke') || desc.includes('brain')) {
      r.metadata.selfCareAdvice = 'Do not let the person sleep or eat. Note the exact time symptoms started.';
      r.metadata.medicationAdvice = 'Absolutely no medications, food, or drink should be given to prevent choking or bleeding.';
      r.metadata.escalationTrigger = 'Every minute counts for brain tissue. Call 911 immediately.';
    } else if (desc.includes('respiratory') || desc.includes('breathing')) {
      r.metadata.selfCareAdvice = 'Sit the person upright to help open their airways. Try to keep them calm to reduce oxygen demand.';
      r.metadata.medicationAdvice = 'Use an emergency rescue inhaler if prescribed for asthma/COPD. Otherwise, avoid medications.';
      r.metadata.escalationTrigger = 'If breathing stops, begin CPR immediately while waiting for 911.';
    } else {
      r.metadata.selfCareAdvice = 'Do NOT attempt to treat this at home. Keep the patient calm and seated safely.';
      r.metadata.medicationAdvice = 'Avoid taking any food, drink, or oral medications until evaluated by EMS.';
      r.metadata.escalationTrigger = 'Emergency Services (911) must be called immediately.';
    }
  } 
  else if (r.metadata.riskCategory === 'Amber') {
    if (desc.includes('infection') || desc.includes('flu') || desc.includes('throat')) {
      r.metadata.selfCareAdvice = 'Isolate from others to prevent spreading. Drink warm fluids and rest in a well-ventilated room.';
      r.metadata.medicationAdvice = 'Fever reducers (like Acetaminophen) can help manage temperature. A doctor may prescribe antibiotics if bacterial.';
      r.metadata.escalationTrigger = 'Go to the ER if you experience difficulty breathing, a fever over 103F, or confusion.';
    } else if (desc.includes('abdominal') || desc.includes('stomach') || desc.includes('appendicitis')) {
      r.metadata.selfCareAdvice = 'Do not eat heavy meals. Sip water slowly to stay hydrated without upsetting the stomach.';
      r.metadata.medicationAdvice = 'Avoid taking pain killers or laxatives as they can mask symptoms of a serious abdominal issue (like appendicitis).';
      r.metadata.escalationTrigger = 'Seek immediate emergency care if the pain becomes sudden and severe, or if vomiting blood.';
    } else if (desc.includes('headache') || desc.includes('vertigo')) {
      r.metadata.selfCareAdvice = 'Lie down in a dark, quiet room. Apply a cool compress to your forehead.';
      r.metadata.medicationAdvice = 'Avoid taking unprescribed migraine medications until a doctor determines the cause.';
      r.metadata.escalationTrigger = 'Go to the ER immediately if the headache is the "worst of your life", or accompanied by vision loss.';
    } else {
      r.metadata.selfCareAdvice = 'Rest and monitor your symptoms closely. Limit strenuous physical activity.';
      r.metadata.medicationAdvice = 'Avoid new medications until evaluated by a doctor. Continue existing prescribed medications.';
      r.metadata.escalationTrigger = 'Seek emergency care immediately if symptoms suddenly worsen rapidly.';
    }
  } 
  else {
    if (desc.includes('cold') || desc.includes('respiratory') || desc.includes('rhinitis')) {
      r.metadata.selfCareAdvice = 'Get plenty of rest, stay hydrated with water and warm teas, and use a humidifier if the air is dry.';
      r.metadata.medicationAdvice = 'Over-the-counter decongestants or antihistamines can help relieve nasal symptoms as directed.';
      r.metadata.escalationTrigger = 'Consult a doctor if symptoms persist beyond 10 days, or if a high fever develops.';
    } else if (desc.includes('headache') || desc.includes('fatigue')) {
      r.metadata.selfCareAdvice = 'Ensure you are getting at least 7-8 hours of sleep. Drink water as dehydration often causes these symptoms.';
      r.metadata.medicationAdvice = 'Over-the-counter pain relievers (like ibuprofen) can be used as directed for mild tension headaches.';
      r.metadata.escalationTrigger = 'See a doctor if the headache or fatigue becomes chronic and affects daily life.';
    } else if (desc.includes('indigestion') || desc.includes('diarrhea')) {
      r.metadata.selfCareAdvice = 'Eat light, bland foods (like bananas, rice, applesauce, toast). Drink oral rehydration solutions to replace lost electrolytes.';
      r.metadata.medicationAdvice = 'Over-the-counter antacids or anti-diarrheal medications can be used carefully following package instructions.';
      r.metadata.escalationTrigger = 'See a doctor if symptoms last more than 48 hours, or if you notice signs of severe dehydration.';
    } else {
      r.metadata.selfCareAdvice = 'Monitor the symptoms over the next few days while maintaining good rest and hydration.';
      r.metadata.medicationAdvice = 'General over-the-counter relief medications are acceptable following package dosing guidelines.';
      r.metadata.escalationTrigger = 'Consult a doctor if symptoms persist for more than 48-72 hours without improvement.';
    }
  }
}

fs.writeFileSync('src/database/seedRules.json', JSON.stringify(rules, null, 2));
console.log('Successfully updated seedRules.json with condition-specific advice.');
