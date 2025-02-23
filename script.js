function timeUntilNextBirthday(birthYear, birthMonth, birthDay) {
    const today = new Date();
    const currentYear = today.getFullYear();
    let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);

    if (nextBirthday < today) {
        nextBirthday.setFullYear(currentYear + 1);
    }

    const timeDiff = nextBirthday - today;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return `تا تولد بعدی شما (${birthYear}-${birthMonth}-${birthDay})، ${days} روز، ${hours} ساعت و ${minutes} دقیقه باقی مانده است.`;
}

console.log(timeUntilNextBirthday(1988, 9, 21));