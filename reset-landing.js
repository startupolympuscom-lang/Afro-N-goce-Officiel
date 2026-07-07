fetch('http://localhost:3000/api/zustand/landing-storage', { method: 'DELETE' }).then(res => res.json()).then(console.log).catch(console.error);
