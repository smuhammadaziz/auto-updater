import React, { useState, useEffect } from "react";
import { MdChevronLeft, MdChevronRight, MdToday } from "react-icons/md";
import moment from "moment";
import "moment/locale/ru";
import "moment/locale/uz";

const CustomCalendar = ({ value, onChange, className = "" }) => {
	const [currentDate, setCurrentDate] = useState(value || new Date());
	const [selectedDate, setSelectedDate] = useState(value || null);
	const [isAnimating, setIsAnimating] = useState(false);
	const [language, setLanguage] = useState("ru");

	useEffect(() => {
		const lang = localStorage.getItem("lang") || "ru";
		setLanguage(lang);
		moment.locale(lang);
	}, []);

	const daysInMonth = moment(currentDate).daysInMonth();
	const firstDayOfMonth = moment(currentDate).startOf("month").day();
	const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
	const currentMonth = moment(currentDate).format("MMMM YYYY");

	const getDaysOfWeek = () => {
		if (language === "uz") {
			return ["Ду", "Се", "Чо", "Па", "Жу", "Ша", "Як"];
		}
		return ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
	};

	const handleDateClick = (day) => {
		const newDate = moment(currentDate).date(day).toDate();
		setSelectedDate(newDate);
		onChange(newDate);
	};

	const handlePrevMonth = () => {
		setIsAnimating(true);
		setCurrentDate(moment(currentDate).subtract(1, "month").toDate());
		setTimeout(() => setIsAnimating(false), 300);
	};

	const handleNextMonth = () => {
		setIsAnimating(true);
		setCurrentDate(moment(currentDate).add(1, "month").toDate());
		setTimeout(() => setIsAnimating(false), 300);
	};

	const isToday = (day) => {
		return (
			moment().date() === day &&
			moment().month() === moment(currentDate).month() &&
			moment().year() === moment(currentDate).year()
		);
	};

	const isSelected = (day) => {
		return (
			selectedDate &&
			moment(selectedDate).date() === day &&
			moment(selectedDate).month() === moment(currentDate).month() &&
			moment(selectedDate).year() === moment(currentDate).year()
		);
	};

	const renderDays = () => {
		const days = [];
		const daysOfWeek = getDaysOfWeek();

		// Add day headers
		daysOfWeek.forEach((day) => {
			days.push(
				<div
					key={`header-${day}`}
					className="text-center text-xs font-semibold text-gray-400 py-2 tracking-wide"
				>
					{day}
				</div>,
			);
		});

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < adjustedFirstDay; i++) {
			days.push(<div key={`empty-${i}`} className="h-10" />);
		}

		// Add days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			const isTodayDate = isToday(day);
			const isSelectedDate = isSelected(day);

			days.push(
				<div
					key={`day-${day}`}
					onClick={() => handleDateClick(day)}
					className={`
                        h-10 flex items-center justify-center text-sm cursor-pointer 
                        rounded-full transition-all duration-200 relative
                        ${isTodayDate ? "text-indigo-600 font-semibold" : ""}
                        ${
							isSelectedDate
								? "bg-indigo-500 text-white"
								: "hover:bg-gray-50"
						}
                        ${
							isAnimating
								? "opacity-0 transform scale-95"
								: "opacity-100 transform scale-100"
						}
                    `}
				>
					{day}
					{isTodayDate && !isSelectedDate && (
						<div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500" />
					)}
				</div>,
			);
		}

		return days;
	};

	return (
		<div
			className={`
            bg-white rounded-xl shadow-xl p-4 w-[280px] 
            border border-gray-100 backdrop-blur-sm
            ${className}
        `}
		>
			<div className="flex items-center justify-between mb-4">
				<button
					onClick={handlePrevMonth}
					className="p-2 rounded-full hover:bg-gray-50 transition-colors 
                             text-gray-500 hover:text-gray-700"
				>
					<MdChevronLeft className="text-lg" />
				</button>
				<div className="flex items-center gap-2">
					<span className="font-semibold text-gray-700 capitalize">
						{currentMonth}
					</span>
					{/* <button
                        onClick={() => handleDateClick(moment().date())}
                        className="p-1.5 rounded-full hover:bg-gray-50 transition-colors 
                                 text-gray-500 hover:text-gray-700"
                    >
                        <MdToday className="text-sm" />
                    </button> */}
				</div>
				<button
					onClick={handleNextMonth}
					className="p-2 rounded-full hover:bg-gray-50 transition-colors 
                             text-gray-500 hover:text-gray-700"
				>
					<MdChevronRight className="text-lg" />
				</button>
			</div>
			<div className="grid grid-cols-7 gap-1">{renderDays()}</div>
		</div>
	);
};

export default CustomCalendar;

