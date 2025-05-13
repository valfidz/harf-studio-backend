const now = new Date();
const nextExecutionDate = new Date(now);
nextExecutionDate.setMonth(nextExecutionDate.getMonth() + 1);
// const formattedDate = now.toLocaleString('en-US', {
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//     hour12: false,
//     timeZone: 'Asia/Jakarta'
// }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6 +0700');

const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta'
    }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6 +0700');
}

export const dateNow = formatDate(now);
export const dateNextExecution = formatDate(nextExecutionDate);