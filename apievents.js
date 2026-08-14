// API endpoint cho Vercel
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const dataPath = path.join(process.cwd(), 'data', 'events.json');
    
    try {
        // Đọc dữ liệu từ file
        let events = [];
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            events = JSON.parse(data);
        }
        
        switch (req.method) {
            case 'GET':
                res.json({
                    success: true,
                    events: events,
                    timestamp: new Date().toISOString()
                });
                break;
                
            case 'POST':
                const newEvent = req.body;
                newEvent.id = 'event_' + Date.now();
                newEvent.createdAt = new Date().toISOString();
                events.push(newEvent);
                fs.writeFileSync(dataPath, JSON.stringify(events, null, 2));
                res.json({
                    success: true,
                    event: newEvent
                });
                break;
                
            case 'PUT':
                const eventId = req.query.id;
                const eventData = req.body;
                const index = events.findIndex(e => e.id === eventId);
                if (index !== -1) {
                    events[index] = { ...events[index], ...eventData };
                    fs.writeFileSync(dataPath, JSON.stringify(events, null, 2));
                    res.json({
                        success: true,
                        event: events[index]
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Event not found'
                    });
                }
                break;
                
            case 'DELETE':
                const deleteId = req.query.id;
                events = events.filter(e => e.id !== deleteId);
                fs.writeFileSync(dataPath, JSON.stringify(events, null, 2));
                res.json({
                    success: true,
                    message: 'Event deleted'
                });
                break;
                
            default:
                res.status(405).json({
                    success: false,
                    error: 'Method not allowed'
                });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};