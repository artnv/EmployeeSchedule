window.addEventListener("load", function() {
	
	var schedule = new EmployeeSchedule();
	
	schedule.init({
		columnName_1: "Сотрудник",
		columnName_2: "Место работы",
		jsonFile: "data.json"
	});
	
	
});
