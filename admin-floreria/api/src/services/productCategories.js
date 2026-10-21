function categoryKey(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ').trim();
}
function categoryName(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFC').replace(/\s+/g,' ').trim();
}
function mergeCategories(...groups) {
  const names=new Map();
  for(const group of groups) for(const value of Array.isArray(group)?group:[]) {
    const name=categoryName(value),key=categoryKey(name);
    if(name && name.length<=120 && !names.has(key)) {
      names.set(key,name);
      const parent=name.split('›')[0].trim();
      if(parent&&!names.has(categoryKey(parent)))names.set(categoryKey(parent),parent);
    }
  }
  return [...names.values()].sort((a,b)=>a.localeCompare(b,'es'));
}
module.exports={categoryKey,categoryName,mergeCategories};
