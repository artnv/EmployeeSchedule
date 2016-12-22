function EmployeeSchedule() {
	
	var d=document,w=window, that=this;
	this.gid = function(id) {if(id) return d.getElementById(id);}
	
	// Конфиг можно передать при инициализации
	this.config = {
		columnName_1: "Employee", 	// Название первой колонки в таблице пользователей
		columnName_2: "Job", 		// Название второй
		jsonFile: "data.json" 		// внешний файл json, загружается встроенным модулем ajax
	};
	
	this.datesArr = new Array();	// даты по которым строится расписание
	this.usersArr = new Array();  	// главный массив с обработанными данными
	// ========================== 
	
	// получение json, 
	this.ajax_getJson = function(path, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", path, true);
		xhr.onload = function () {
			if (xhr.readyState === xhr.DONE) {
				if (xhr.status === 200) {
					callback(xhr.responseText); 
				}
			}
		};
		xhr.send(null);
	}
	
	// летающий статус, запускать после генерации сетки
	this.addCanFly = function() {
		// летающие описание
		function hoverbox(e,showDiv) {
			var x = e.pageX, y = e.pageY;
			showDiv.style.left = (x+10)+'px';
			showDiv.style.top = (y+20)+'px';
		}
		
		var info = d.querySelectorAll(".infobox");
		
		for(var  i=0, len = info.length;i<len;i++) {
			var inf = info[i];
			(function() {
				var showDiv = inf.querySelector(".show");
				inf.addEventListener("mousemove", function(e) {hoverbox(e,showDiv);});
			})();
		}
	}
	
	// вычитает из max-min
	this.getMaxMinTime = function(max, min, what) {

		var maxDays = Date.parse(max), minDays = Date.parse(min);
		var milliseconds, seconds, minutes, hours, days, res = 0;
		
		milliseconds = maxDays - minDays;
		seconds = milliseconds / 1000;
		minutes = seconds / 60;
		hours = minutes / 60;
		days = hours / 24;
		
		switch(what) {
			case "milliseconds":
				res = milliseconds;
			break;		
			case "seconds":
				res = seconds;
			break;
			case "minutes":
				res = minutes;
			break;
			case "hours":
				res = hours;
			break;
			case "days":
				res = days;
			break;
		}
			
		return Math.ceil(res);
	}
	
	// объединяем юзеров и создаем массив с обработанными данными
	this.unitedUsers = function(json) {
		
		// доп. мелкие функции
		
		// возвращает час от даты (19 - 19:00), если 00 то вернет 24
		function ext_getHour(time) {
			var t = new Date(Date.parse(time)).getHours();
			//if(t == 0) 	{t = 24;}
			return t;
		}
		
		// возвращает процент выполнения
		function ext_getPercent(fakt_date_end, fakt_date_start, plan_date_end, plan_date_start) {

			fakt_date_end 	= Date.parse(fakt_date_end);
			fakt_date_start = Date.parse(fakt_date_start);
			plan_date_end 	= Date.parse(plan_date_end);
			plan_date_start = Date.parse(plan_date_start);
			
			var fakt_percent = (((fakt_date_end-fakt_date_start)*100)/(plan_date_end-plan_date_start)).toFixed(3);
			// работает без этого, но на всякий
			if(fakt_percent > 100) fakt_percent = 100;
			if(fakt_percent < 0) fakt_percent = 0;
			
			//console.log(fakt_percent+': '+fakt_date_end +'-'+ fakt_date_start +'-'+ plan_date_end +'-'+ plan_date_start)
			return fakt_percent;
		}
		
		// ===============
		
		var len = json.length;
		var	found = 0; // индекс нового массива
		
		//по всем объектам n*n (100*100)
		for(var i=0;i<len;i++) {
			if(json[i]) {

				var planShort 		= this.getMaxMinTime(json[i].plan[4], json[i].plan[3], "hours");
				var planPx 			= planShort*29+planShort; // час за 30px + borders
				var faktShort 		= this.getMaxMinTime(json[i].fakt[4], json[i].fakt[3], "hours");
				var mod_notcome 	= false; // не пришел. если дата в факте пуста то true
				var startTime 		= ext_getHour(json[i].plan[3]);
				var percent 		= ext_getPercent(json[i].fakt[4], json[i].fakt[3], json[i].plan[4], json[i].plan[3]); // процент завершения
				var lateMin 		= this.getMaxMinTime(json[i].fakt[3], json[i].plan[3], "minutes"); // опоздание мин
				
		
				//
				if(isNaN(faktShort)) {
					faktShort = 0;
					mod_notcome = true;
				}
				
				//
				this.usersArr[found] = new Array();
				this.usersArr[found][0] = json[i].plan[0];  		// имя
				this.usersArr[found][1] = json[i].plan[1];			// ресторан
				this.usersArr[found][2] = [json[i].plan[2]]; 		// должность
				this.usersArr[found][3] = [json[i].plan[3]]; 		// план.дата.начало
				this.usersArr[found][4] = [json[i].plan[4]]; 		// план.дата.конец
				this.usersArr[found][5] = [json[i].fakt[3]]; 		// факт.дата.начало
				this.usersArr[found][6] = [json[i].fakt[4]]; 		// факт.дата.конец
				this.usersArr[found][7] = [lateMin]; 				// опоздание мин
				this.usersArr[found][8] = [mod_notcome]; 			// не пришел
				this.usersArr[found][9] = [false]; 					// ушел раньше
				this.usersArr[found][10] = [startTime]; 			// план. 16,21 начало вставки (16:00, 21:00)
				this.usersArr[found][11] = [planPx]; 				// план. 3,4 (кол-во клеток) в пикселях, сколько нужно закрашивать клеток
				this.usersArr[found][12] = [faktShort]; 			// факт. 2,4 (на сколько продвинулось)
				this.usersArr[found][13] = [percent]; 				// процент выполнения
				this.usersArr[found][14] = [planShort]; 			// план. 3,4 
				
				// n*n, объединяем одинаковых юзеров, с разным временем
				for(var e=i;e<len;e++) {
					if(json[e] && e != i) {
						
						var dateI = json[i].plan[3].split(' ');
						var dateE = json[e].plan[3].split(' ');
						
						// находим совпадения
						if(json[i].plan[0] == json[e].plan[0] && json[i].plan[1] == json[e].plan[1] && dateI[0] == dateE[0]) {
							// если нашли, то добавляем в массивы данные других объектов
							
							planShort 			= this.getMaxMinTime(json[e].plan[4], json[e].plan[3], "hours");
							planPx 				= planShort*29+planShort; // час за 30px + borders
							faktShort 			= this.getMaxMinTime(json[e].fakt[4], json[e].fakt[3], "hours");
							mod_notcome 		= false; // не пришел. если дата в факте пуста то true
							startTime 			= ext_getHour(json[e].plan[3]);
							percent 			= ext_getPercent(json[e].fakt[4], json[e].fakt[3], json[e].plan[4], json[e].plan[3]); // процент завершения
							lateMin 			= this.getMaxMinTime(json[e].fakt[3], json[e].plan[3], "minutes"); // опоздание мин
							
							//
							if(isNaN(faktShort)) {
								faktShort = 0;
								mod_notcome = true;
							}
				
							this.usersArr[found][2].push(json[e].plan[2]); 		// должность
							this.usersArr[found][3].push(json[e].plan[3]); 		// план.дата.начало
							this.usersArr[found][4].push(json[e].plan[4]); 		// план.дата.конец
							this.usersArr[found][5].push(json[e].fakt[3]); 		// факт.дата.начало
							this.usersArr[found][6].push(json[e].fakt[4]); 		// факт.дата.конец	
							this.usersArr[found][7].push(lateMin); 				// опоздание мин
							this.usersArr[found][8].push(mod_notcome); 			// не пришел
							this.usersArr[found][9].push(false); 				// ушел раньше
							this.usersArr[found][10].push(startTime); 			// план. 16,21 начало вставки (16:00, 21:00)
							this.usersArr[found][11].push(planPx); 				// план. 3,4 (кол-во клеток) в пикселях, сколько нужно закрашивать клеток
							this.usersArr[found][12].push(faktShort); 			// факт. 2,4 (на сколько продвинулось)
							this.usersArr[found][13].push(percent); 			// процент выполнения
							this.usersArr[found][14].push(planShort); 			// план. 3,4 
							
							// ---
							//console.log(i+':'+json[i].plan[0] +' - e:' +e);
							json[e] = null; //затираем чтобы повторно не использовать
						}
						
					} else continue;
				}
				
				found++;
			} else continue;
		}
	}
	
	// рисуем юзеров
	this.renderUsers = function() {
			
		var tbl_users 	= this.gid("tbl_users");	// 	юзер/ресторан
		usersStr = '<div class="tbl_row"><div class="tbl_td">'+this.config.columnName_1+'</div><div class="tbl_td">'+this.config.columnName_2+'</div></div>';
	
		for(var i=0,len = this.usersArr.length;i<len;i++) {
			usersStr += '<div class="tbl_row"><div class="tbl_td">'+this.usersArr[i][0]+'</div><div class="tbl_td">'+this.usersArr[i][1]+'</div></div>';
		}
		
		tbl_users.innerHTML = usersStr;
	}
	
	// создаем даты
	this.createDates = function(json) {
		// если нет такой же даты, то добавляем
		function searchAndPush(start,end) {
			var notFoundStart = true, notFoundEnd = true;
			
			for(var e=0,len2=that.datesArr.length;e<len2;e++) {
				if(that.datesArr[e] == Date.parse(start)) {
					notFoundStart = false;
				}	
				if(that.datesArr[e] == Date.parse(end)) {
					notFoundEnd = false;
				}
			}
			
			if(start == end) notFoundEnd = false; // если оба равны, то повторно не записываем
			
			// push
			if(notFoundStart == true) {
				that.datesArr.push(Date.parse(start));
			}	
			if(notFoundEnd == true) {
				that.datesArr.push(Date.parse(end));
			}
			
		}
		
		var start='',end='';
		
		// берем даты
		for(var i=0, len = json.length;i<len;i++) {
			start = json[i].plan[3].split(' ');
			end = json[i].plan[4].split(' ');
			searchAndPush(start[0],end[0]);
		}
		
		// сортировка
		this.datesArr.sort(function(a, b){return a-b;});
		
		// превращение обратно в дату
		for(var j=0,len3=this.datesArr.length;j<len3;j++) {
			
			var x = new Date(this.datesArr[j]),m=0,d=0;
			
			d = x.getDate();
			m = x.getMonth()+1;
			
			if(d < 10) d = "0"+d;
			if(m < 10) m = "0"+m;
			
			this.datesArr[j] = x.getFullYear() + '-' + m + '-' + d;
		}

	}
	
	// рисует расписание
	this.renderField = function() {
		
		var tbl_info 	= this.gid("tbl_info");
		var hoursStr = '', infoboxStr = '';
		
		// цикл по дням
		for(var e=0, len = this.datesArr.length;e<len;e++) {
			
			infoboxStr = '';

			// цикл по всем юзерам. Создаем ячейки под датой
			for(var i=0, len2 = this.usersArr.length;i<len2;i++) {
				
				infoboxStr += '<div class="hours">';
				//вставляет данные в ячейку. 24 div
				
				var tmpDate = this.usersArr[i][3][0].split(' ');
				
				// цикл создает 24 клетки с 0 по 23 час.
				for(var j=0;j<24;j++) {
					// если даты совпадают
					if(this.datesArr[e] == tmpDate[0]) {
						
						var notFound = true;
						
						// у одного юзера может быть несколько смен
						for(var k=0, len3 = this.usersArr[i][10].length;k<len3;k++) {
							if(j == this.usersArr[i][10][k]) {
								
								lateMin = this.usersArr[i][7][k];
								var late_n_before = '', lateStr = '', info_n_fakt = '', headerFly='';
								
								// статус - опоздание
								if(lateMin > 0 && lateMin != 0) {
									late_n_before 	= "mod_late";
									lateStr 		= '<span class="status_info"><span class="pos">'+lateMin+'м</span>Опоздание:</span>';
								} else {
									late_n_before 	= '';	
									lateStr 		= '';
									lateMin 		= 0;
								}
								
								// то статус - не явился
								if(this.usersArr[i][8][k]) {
									info_n_fakt 	= 'mod_notcome';
									late_n_before 	= '';
									headerFly		= 'Не явился';
								} else {
									info_n_fakt 	= '';
									headerFly 		= this.usersArr[i][12][k]+' ч. '+parseInt(this.usersArr[i][13][k])+'%';
								}
								
												
								// данные для клетки
								infoboxTpl = '<div class="infobox"><span class="info '+info_n_fakt+'" style="width:'+this.usersArr[i][11][k]+'px;">'+this.usersArr[i][2][k]+'</span><span class="show"><span class="status_info_h"><span class="pos">'+this.usersArr[i][2][k]+'</span>'+headerFly+'</span><span class="plan '+late_n_before+'"><span class="fakt '+info_n_fakt+'" style="width: '+this.usersArr[i][13][k]+'%;"></span></span><span class="status_info"><span class="pos">'+this.usersArr[i][14][k]+' час.</span>План:</span>'+lateStr+'</span></div>';
				
								infoboxStr += infoboxTpl;
								notFound = false;
							} 
						}
						
						if(notFound) {
							infoboxStr += '<div></div>';
						}
						
					} else {
						infoboxStr += '<div></div>';
					}
					
				}
				infoboxStr += '</div>';
				
			}
			

			// горизонтальные блоки inline-block
			hoursStr += '<div class="horizontal">';
			hoursStr += '<div class="h_date">'+this.datesArr[e]+'</div>'; // date
			
			hoursStr += '<div class="h_hours"><div>00</div><div>01</div><div>02</div><div>03</div><div>04</div><div>05</div><div>06</div><div>07</div><div>08</div><div>09</div><div>10</div><div>11</div><div>12</div><div>13</div><div>14</div><div>15</div><div>16</div><div>17</div><div>18</div><div>19</div><div>20</div><div>21</div><div>22</div><div>23</div></div>'; // header num

			hoursStr += infoboxStr; //data
			hoursStr += '</div><!--horizontal-->';
		}
		
		tbl_info.innerHTML 	= hoursStr;
	}
	
	// выполнение
	this.process = function(jsonTxt) {
		
		if(!jsonTxt) return false;
	
		var json = JSON.parse(jsonTxt); // данные json
		
		//that.datesArr = new Array();
		
		that.createDates(json);		// 1. создание массива дат
		that.unitedUsers(json); 	// 2. объединение юзеров и создание доп. данных
		that.renderUsers();			// 3. отображение юзеров
		that.renderField();			// 4. отображает расписание
		that.addCanFly(); 			// 5. летающий статус в расписании
	
	}
	
	// запуск
	this.init = function(userConfig) {
		if(userConfig) this.config = userConfig;
		
		// загружаем скрипт аяксом
		if(this.config.jsonFile) {
			this.ajax_getJson(this.config.jsonFile, this.process);
		} else {
			// так же можно просто передать строку с json
			//this.process(txt);
		}
		
	}
	
}
