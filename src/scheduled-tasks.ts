import cron from 'node-cron';
import Attendance from './models/attendance.model';
import moment from 'moment';

const runMorningSessionTask = async (): Promise<void> => {
    try {
        // Find all attendance records where clockOut is null
        const pendingAttendances = await Attendance.findAll({
            where: { clockOut: null },
            attributes: ["id", "clockIn"],
        });

        for (const attendance of pendingAttendances) {
            // Use moment with IST offset to ensure correct day/time extraction
            const clockOutDate = moment(attendance.clockIn)
                .utcOffset('+05:30')
                .set({
                    hour: 20,
                    minute: 0,
                    second: 0,
                    millisecond: 0
                })
                .toDate();

            await Attendance.update(
                { clockOut: clockOutDate },
                { where: { id: attendance.id } }
            );

            console.log(
                `Updated attendance ${attendance.id} with clockOut = ${moment(clockOutDate).utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss')} IST`
            );
        }

        return Promise.resolve();
    } catch (error) {
        console.error("Error in runMorningSessionTask:", error);
        throw error;
    }
};


/**
 * Initializes all scheduled tasks
 */
const initializeScheduledTasks = (): void => {
    console.log('Initializing scheduled tasks...');

    // Schedule the morning session task to run every day at 8:00 PM
    // cron.schedule('0 20 * * *', async () => {
    cron.schedule('0 20 * * *', async () => {
        console.log('Running scheduled task...');

        try {
            await runMorningSessionTask();
            console.log('task completed successfully');
        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    }, {
        timezone: 'Asia/Kolkata' // Run at 8:00 PM IST
    });

    console.log('All scheduled tasks initialized');
};

// Automatically initialize scheduled tasks when this module is imported
initializeScheduledTasks();

// Export for manual initialization if needed
export { initializeScheduledTasks };