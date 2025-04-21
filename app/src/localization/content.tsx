import { NavLink } from "react-router-dom";

type Content = {
	[key: string]: {
		intro: {
			welcome: string;
			please: string;
			enter: string;
			send: string;
			network: string;
			try: string;
			pleaseEnterKsb: string;
			pleaseEnter8: string;
			requestTimeOut: string;
			checking: string;
			error: string;
			needTime: string;
			recoveryYourInformation: string;
			fetchingDevice: string;
			upsertingProducts: string;
		};
		login: {
			login: string;
			loginButton: string;
			select: string;
			password: string;
			enterPass: string;
			error: string;
			selectUserType: string;
			databaseBlocked: string;
			serverError: string;
			fetchError: string;
			requestTimeOut: string;
			noInternetConnection: string;
			connectionError: string;
			passwordSetSuccessfully: string;
			failedToSetPassword: string;
			pleaseEnterPassword: string;
		};
		home: {
			totalSales: string;
			activeClient: string;
			products: string;
			salesDashboard: string;
			clientManagement: string;
			productCatalog: string;
			salesChart: string;
			time: {
				day: string;
				week: string;
				month: string;
				year: string;
			};
			soon: string;
		};
		innerLayout: {
			home: string;
			customers: string;
			products: string;
			settings: string;
			rus: string;
			uz: string;
		};
		enterpriseInfo: {
			infos: string;
			signout: string;
			update: string;
		};
		syncing: {
			complete: string;
			data: string;
			close: string;
		};
		noInternet: {
			title: string;
			message: string;
			close: string;
		};
		client: {
			detail: string;
			name: string;
			phone: string;
			no_phone: string;
			actions: string;
			view: string;
			contact: string;
			search: string;
			positive: string;
			negative: string;
		};
		product: {
			detail: string;
			search: string;
			name: string;
			type: string;
			symbol: string;
			currency: string;
			article: string;
			box: string;
			extra: string;
			view: string;
			main: string;
			stock: string;
			price: string;
			barcodes: string;
			quantity: string;
			sale: string;
			not_available: string;
			loading: string;
		};
		settingsUsers: {
			users: string;
			active: string;
			current: string;
			currentDevice: string;
			others: string;
			security: string;
			recovery: string;
			logout: string;
			currenctPass: string;
			newPassword: string;
			confirmNewPassword: string;
			updatePassword: string;
			recoveryYourInformation: string;
			recoveryNow: string;
			recoveryEnterYourPassword: string;
			recoveryProcessingRequest: string;
			recoveryDataSuccess: string;
		};
		salesPage: {
			headerClients: string;
			headerDiscount: string;
			headerList: string;
			headerListSubText: string;
			headerListSearch: string;
			headerListDateSelect: string;
			headerListFilter: string;
			headerListFilterClear: string;
			headerListFound: string;
			headerListFilterStatus: string;
			headerListFilterStatusPending: string;
			headerListFilterStatusSucess: string;
			headerListFilterStatusNotSuccess: string;
			headerListFilterStatusError: string;
			headerListTableDate: string;
			headerListTableDWarehouse: string;
			headerListTableClient: string;
			headerListTableSumma: string;
			headerListTableStatus: string;
			headerListTableAvtor: string;
			headerListTableActions: string;
			headerListTableMain: string;
			headerDiscountSumma: string;
			headerDiscountToPay: string;
			headerDiscountCancel: string;
			soldName: string;
			soldCount: string;
			soldPrice: string;
			soldSumma: string;
			soldNoProduct: string;
			sidebarCash: string;
			sidebarCashPay: string;
			sidebarCashToPay: string;
			sidebarCashNoPermit: string;
			sidebarCashCash: string;
			sidebarCashCard: string;
			sidebarCashTotalPrice: string;
			sidebarCashComment: string;
			sidebarCard: string;
			sidebarProcess: string;
			footerExit: string;
			footerExitConfirm: string;
			footerExitYes: string;
			footerNewSales: string;
			saleSearch: string;
			saleDeleteConfirm: string;
			saleDeleteYes: string;
			saleTableName: string;
			saleTableCurrency: string;
			saleTableOstatka: string;
			saleTablePriceCurrency: string;
			saleTablePrice: string;
			saleTableWarehouse: string;
			saleModalCount: string;
			saleModalNotEnough: string;
			sidebarClientSelect: string;
			sidebarClientSearch: string;
		};
		headerProfile: {
			settings: string;
			configure: string;
			logout: string;
			logtext: string;
			lastSync: string;
		};
		changePassword: {
			noInternet: string;
			noInternetText: string;
			internetRequiredToChange: string;
			requiredField: string;
			newPasswordNotMatch: string;
			oldPasswordWrong: string;
			changeSuccess: string;
			errorToast: string;
		};
		exit: {
			exit: string;
			exitTest: string;
		};
		firstSync: {
			downloadSettings: string;
			clickToBelow: string;
			startSync: string;
			pleaseWait: string;
			syncComplete: string;
			dataSuccessfullySynced: string;
			syncFailed: string;
			deviceAlreadyRegistered: string;
			tryAgain: string;
			goToKSB: string;
			noInternet: string;
			pleaseCheck: string;
		};
		settingsDevice: {
			autoSendSales: string;
			setTimeToSend: string;
			currentSendTime: string;
			newSendTime: string;
			timeoutSettings: string;
			setTimeoutForYou: string;
			saveTimeout: string;
			timeoutSaved: string;
		};
		itsDeadlineModal: {
			yourITS: string;
			updateITS: string;
			exitProgram: string;
		};
		permissionModal: {
			tasdiqlandi: string;
			haliBeriTasdiqlanmadi: string;
			qurilmaTopilmadi: string;
			qurilmadaXatolik: string;
			dasturdanChiqish: string;
			ksbidDanChiqish: string;
			qaytaUrinish: string;
		};
		paymentModal: {
			printCheck: string;
			yes: string;
			no: string;
			processSales: string;
			success: string;
			problemToSendSales: string;
		};
		innerFooter: {
			its: string;
		};
		summaSection: {
			summa: string;
			discount: string;
			toPay: string;
		};
		trashSales: {
			deletedSales: string;
			deletedSalesText: string;
			status: string;
			client: string;
			totalPrice: string;
			seller: string;
			deletedAt: string;
			error: string;
			actions: string;
			noTrashSalesFound: string;
		};
	};
};

const content: Content = {
	uz: {
		intro: {
			welcome: "KSB Порталга Хуш Келибсиз",
			please: "Давом етиш учун KSB-ID ни киритинг",
			enter: "KSB-ID ни киритинг",
			send: "Тизимга Кириш",
			network: "Тармоққа уланиш йўқ",
			try: "Қайта уланишга уриниш...",
			pleaseEnterKsb: "Илтимос, КСБ ИД ни киритинг",
			pleaseEnter8: "Илтимос, 8 та рақам киритинг",
			requestTimeOut:
				"Сўровни кутиш вақти тугаши. Илтимос, қайта уриниб коʻринг.",
			checking: "Текширилмоқда...",
			error: "Номаълум хатолик",
			needTime: "Бу бироз вақт талаб қилади.",
			recoveryYourInformation:
				"Маълумотларингизни тайёрлаш давом этмоқда...",
			fetchingDevice: "Клиентга оид маълумотлар юклаб олинмоқда...",
			upsertingProducts: "Маҳсулотлар, валюталар, ўлчов бирлик...",
		},
		login: {
			login: "Базага кириш",
			loginButton: "Кириш",
			select: "Фойдаланувчи",
			password: "Парол",
			enterPass: "Паролни киритинг",
			error: "Фойдаланувчиларни олиб бўлмади",
			selectUserType: "Фойдаланувчи турини танланг",
			databaseBlocked: "Маълумотлар базаси блокланган",
			serverError:
				"Ички сервер хатоси юз берди.  Кейинроқ қайта уриниб кўринг.",
			fetchError:
				"Кутилмаган хатолик юз берди. Илтимос, қайта уриниб коʻринг.",
			requestTimeOut:
				"Сўров муддати тугади. Илтимос, уланишингизни текширинг ва қайтадан урининг.",
			noInternetConnection:
				"Интернет алоқаси ёъқ. Илтимос, тармоқингизни текширинг ва қайтадан урининг.",
			connectionError: "Уланиш хатоси. Интернет уланишингизни текширинг.",
			passwordSetSuccessfully: "Парол муваффақиятли оʻрнатилди",
			failedToSetPassword:
				"Тизимга кириш хатоси. Фойдаланувчи номи ва паролни текширинг.",
			pleaseEnterPassword: "Илтимос, паролни киритинг",
		},
		home: {
			totalSales: "Умумий савдо суммаси",
			activeClient: "Клиентлар",
			products: "Маҳсулотлар",
			salesDashboard: "Савдо ойнаси",
			clientManagement: "Клиентлар",
			productCatalog: "Маҳсулотлар",
			salesChart: "Савдо графиги",
			time: {
				day: "Кунлик",
				week: "Ҳафталик",
				month: "Ойлик",
				year: "Йиллик",
			},
			soon: "Тез орада",
		},
		innerLayout: {
			home: "Бош саҳифа",
			customers: "Мижозлар",
			products: "Маҳсулотлар",
			settings: "Созламалар",
			rus: "Рус",
			uz: "Узб",
		},
		enterpriseInfo: {
			infos: "Корхона маълумотлари",
			signout: "KSB-ID дан чиқиш",
			update: "Янгилаш",
		},
		syncing: {
			complete: "Синхронизация тугади",
			data: "Маълумотларингиз муваффақиятли синхронлаштирилди!",
			close: "Ok",
		},
		noInternet: {
			title: "Интернет алоқаси йўқ",
			message:
				"Илтимос, тармоқ уланишингизни текширинг ва қайтадан уриниб кўринг.",
			close: "Ёпиш",
		},
		client: {
			detail: "Клиентлар",
			name: "Клиент",
			phone: "Телефон",
			no_phone: "-",
			actions: "Қўшимча",
			view: "Кўпроқ",
			contact: "Контакт маълумотлари",
			search: "Қидириш...",
			positive: "Хакдорлик",
			negative: "Карздорлик",
		},
		product: {
			detail: "Маҳсулотлар",
			search: "Қидириш...",
			name: "Маҳсулот",
			type: "тури",
			symbol: "ўлчов",
			currency: "валюта",
			article: "Артикул",
			box: "Коробка",
			extra: "қўшимча",
			view: "батафсил",
			main: "асосий",
			stock: "Склад",
			price: "нарх",
			barcodes: "Штрих-кодлар",
			quantity: "миқдор",
			sale: "сотиш",
			not_available: "Ҳозирча мавжуд эмас",
			loading: "Юкланмоқда",
		},
		settingsUsers: {
			users: "Фойдаланувчилар",
			active: "Актив",
			current: "Жорий фойдаланувчи",
			currentDevice: "Жорий",
			others: "Бошқа фойдаланувчилар",
			security: "Хавсизлик",
			recovery: "Синхронизация",
			logout: "Аккаунтдан чиқиш",
			currenctPass: "Жорий парол",
			newPassword: "Янги парол",
			confirmNewPassword: "Янги паролни тасдиқланг",
			updatePassword: "Ўзгартириш",
			recoveryYourInformation: "Маълумотларингизни қайта тикланг",
			recoveryNow: "Қайта тиклаш",
			recoveryEnterYourPassword:
				"Маълумотингизни тиклаш учун қуйида паролингизни киритинг. ",
			recoveryProcessingRequest: "Амалиёт бажарилмоқда...",
			recoveryDataSuccess:
				"Қайта тиклаш муваффақиятли!  Маълумотларингиз тикланди. ",
		},
		salesPage: {
			headerClients: "Клиентлар",
			headerDiscount: "Чегирма",
			headerList: "Савдо рўйҳати",
			headerListSubText: "Савдоларни бошқариш учун",
			headerListSearch: "Номи, миқдори бўйича қидиринг...",
			headerListDateSelect: "Санани танланг",
			headerListFilter: "Филтерлар",
			headerListFilterClear: "Филтерларни тозалаш",
			headerListFound: "Топилди:",
			headerListFilterStatus: "Статус бўйича филтер:",
			headerListFilterStatusPending: "Жараёнда",
			headerListFilterStatusSucess: "Тасдиқланган",
			headerListFilterStatusNotSuccess: "Тасдиқланмаган",
			headerListFilterStatusError: "Хатолик мавжуд",
			headerListTableDate: "Сана",
			headerListTableDWarehouse: "Склад",
			headerListTableClient: "Клиент",
			headerListTableSumma: "Сумма",
			headerListTableStatus: "Статус",
			headerListTableAvtor: "Автор",
			headerListTableActions: "Кўпроқ",
			headerListTableMain: "Асосий",
			headerDiscountSumma: "Сумма",
			headerDiscountToPay: "Тўлов учун",
			headerDiscountCancel: "Бекор қилиш",
			soldName: "Маҳсулот",
			soldCount: "Сони",
			soldPrice: "Нархи",
			soldSumma: "Сумма",
			soldNoProduct: "Ҳозирча маҳсулотлар йўқ",
			sidebarCash: "Нақд",
			sidebarCashPay: "Тўлов",
			sidebarCashToPay: "Тўлов учун",
			sidebarCashNoPermit: "Қолдиқ суммада хатолик мавжуд",
			sidebarCashCash: "Нақд",
			sidebarCashCard: "Пластик карта",
			sidebarCashTotalPrice: "Қолдиқ сумма",
			sidebarCashComment: "Изох",
			sidebarCard: "Онлайн",
			sidebarProcess: "Кечиктирилган савдо",
			footerExit: "Чиқиш",
			footerExitConfirm: "Савдо ойнасидан чиқмоқчимисиз?",
			footerExitYes: "Ҳа, чиқиш",
			footerNewSales: "Янги Савдо",
			saleSearch: "Қидириш",
			saleDeleteConfirm: "Танланган барча маҳсулотларни ўчирмоқчимисиз?",
			saleDeleteYes: "Ҳа, ўчириш",
			saleTableName: "Маҳсулот",
			saleTableCurrency: "Валюта",
			saleTableOstatka: "Қолдиқ",
			saleTablePriceCurrency: "Нарх, Валюта",
			saleTablePrice: "Нарх",
			saleTableWarehouse: "Склад",
			saleModalCount: "Сони",
			saleModalNotEnough: "Қолдиқда йетарли эмас",
			sidebarClientSelect: "Клиент танлаш",
			sidebarClientSearch: "қидириш",
		},
		headerProfile: {
			settings: "Созламалар",
			configure: "Аккаунтизни созланг",
			logout: "Чиқиш",
			logtext: "Аккаунтдан чиқиш",
			lastSync: "Охирги янгиланиш:",
		},
		changePassword: {
			noInternet: "Интернет алоқаси йўқ",
			noInternetText: "Паролингизни ўзгартириш учун Интернетга уланинг. ",
			internetRequiredToChange:
				"Паролингизни ўзгартириш учун Интернетга уланинг.",
			requiredField: "Барча жойларни тўлдириш керак",
			newPasswordNotMatch: "Янги парол ва тасдиқлаш пароли мос келмади",
			oldPasswordWrong: "Жорий парол хато",
			changeSuccess: "Парол муваффақиятли ўзгартирилди",
			errorToast: "Хатолик.  Парол ўзгартиришда хатолик мавжуд",
		},
		exit: {
			exit: "Чиқиш",
			exitTest: "Дастурда ишни якунламоқчимисиз?",
		},
		firstSync: {
			downloadSettings: "Синхронизацияни бошланг",
			clickToBelow: "Бошланғич маълумотларингизни юклаб олинг",
			startSync: "Бошлаш",
			pleaseWait: "Илтимос кутинг, амалиёт бажарилмоқда",
			syncComplete: "Синхронизация тугади",
			dataSuccessfullySynced:
				"Маълумотларингиз муваффақиятли синхронизация қилинди",
			syncFailed: "Синхронизация жараёнида хатолик",
			deviceAlreadyRegistered:
				"Бу Фойдаланувчи аллақачон рўйхатдан ўтган.",
			tryAgain: "Қайта уриниб кўринг",
			goToKSB: "KSB-ID дан чиқиш",
			noInternet: "Интернетга уланмаган",
			pleaseCheck:
				"Бошланғич маълумотларингизни синхронизация қилиш учун интернетга уланишингиз керак. ",
		},
		settingsDevice: {
			autoSendSales: "Савдоларни автоматик юбориш",
			setTimeToSend: "Савдоларни автоматик юбориш учун вақт танланг",
			currentSendTime: "Жорий вақт",
			newSendTime: "Савдоларни автоматик юбориш янги вақтга ўзгарди: ",
			timeoutSettings: "TimeOut созламалари",
			setTimeoutForYou: "TimeOut учун вақт киритинг (секундларда)",
			saveTimeout: "Сақлаш",
			timeoutSaved: "TimeOut учун янги вақт сақланди:",
		},
		itsDeadlineModal: {
			yourITS: "Сизнинг ИТС муддатингиз тугади!",
			updateITS: "Илтимос, обунангизни янгиланг.",
			exitProgram: "Дастурдан чиқиш",
		},
		permissionModal: {
			tasdiqlandi: "Тасдиқланди",
			haliBeriTasdiqlanmadi: "Бу қурилма ҳали бери тасдиқланмади",
			qurilmaTopilmadi: "Қурилма топилмади.",
			qurilmadaXatolik: "Қурилмани тасдиқлашда хатолик.",
			dasturdanChiqish: "Дастурдан чиқиш",
			ksbidDanChiqish: "KSB-ID дан чиқиш",
			qaytaUrinish: "Қайта текшириш",
		},
		paymentModal: {
			printCheck: "Савдодан чек чиқарасизми?",
			yes: "Ҳа",
			no: "Йўқ",
			processSales: "Амалиёт бажарилмоқда",
			success: "",
			problemToSendSales: "Савдо юборилмади",
		},
		innerFooter: {
			its: "Техник қўллаб қувватлаш (ITS) муддати тугашига ${timeLeft} қолди. Қўшимча маълумот учун: +998 78 298 09 99",
		},
		summaSection: {
			summa: "Савдо",
			discount: "Чегирма",
			toPay: "Тўлов учун",
		},
		trashSales: {
			deletedSales: "Ўчирилган савдолар",
			deletedSalesText: "Ўчириган савдоларни бошқариш ойнаси",
			status: "Статус",
			client: "Клиент",
			totalPrice: "Сумма",
			seller: "Сотувчи",
			deletedAt: "Ўчирилган вақт",
			error: "Хатолик",
			actions: "Қўшимча",
			noTrashSalesFound: "Ўчирилган савдолар ҳозирча мавжуд эмас.",
		},
	},
	ru: {
		intro: {
			welcome: "Добро пожаловать на портал KSB",
			please: "Пожалуйста, введите свой KSB-ID",
			enter: "Введите свой KSB-ID",
			send: "Войти",
			network: "Нет сетевого подключения",
			try: "Попытка повторного подключения...",
			pleaseEnterKsb: "Пожалуйста, введите KSB ID",
			pleaseEnter8: "Пожалуйста, введите 8 цифр",
			requestTimeOut:
				"Запросить тайм-аут. Пожалуйста, попробуйте еще раз.",
			checking: "Проверка...",
			error: "Неизвестная ошибка",
			needTime: "Это займет некоторое время.",
			recoveryYourInformation: "Подготовка ваших данных продолжается...",
			fetchingDevice: "Загрузка информации о клиенте...",
			upsertingProducts: "Продукты, валюты, единицы измерения...",
		},
		login: {
			login: "Доступ к базе",
			loginButton: "Войти",
			select: "Пользователь",
			password: "Пароль",
			enterPass: "Введите пароль",
			error: "Не удалось получить пользователей.",
			selectUserType: "Выберите тип пользователя",
			databaseBlocked: "База данных заблокирована",
			serverError:
				"Произошла внутренняя ошибка сервера. Повторите попытку позже.",
			fetchError: "Произошла непредвиденная ошибка. Попробуйте еще раз.",
			requestTimeOut:
				"Запрос истек. Проверьте соединение и попробуйте еще раз.",
			noInternetConnection:
				"Нет подключения к интернету. Проверьте сеть и попробуйте еще раз.",
			connectionError:
				"Ошибка подключения. Проверьте подключение к интернету.",
			passwordSetSuccessfully: "Пароль успешно установлен",
			failedToSetPassword:
				"Ошибка авторизации. Проверьте имя пользователя и пароль.",
			pleaseEnterPassword: "Пожалуйста, введите пароль",
		},
		home: {
			totalSales: "Общая сумма продаж",
			activeClient: "Клиенты",
			products: "Продукты",
			salesDashboard: "Торговое окно",
			clientManagement: "Клиенты",
			productCatalog: "Номенклатуры товаров",
			salesChart: "Торговый график",
			time: {
				day: "День",
				week: "Неделя",
				month: "Месяц",
				year: "Год",
			},
			soon: "Скоро",
		},
		innerLayout: {
			home: "Дом",
			customers: "Клиенты",
			products: "Продукты",
			settings: "Настройки",
			rus: "Рус",
			uz: "Узб",
		},
		enterpriseInfo: {
			infos: "Информация о компании",
			signout: "Выйти из KSB-ID",
			update: "Обновить",
		},
		syncing: {
			complete: "Синхронизация завершена",
			data: "Ваши данные успешно синхронизированы!",
			close: "Ок",
		},
		noInternet: {
			title: "Нет подключения к интернету",
			message:
				"Пожалуйста, проверьте сетевое подключение и попробуйте снова.",
			close: "Закрыть",
		},
		client: {
			detail: "Клиенты",
			name: "Имя",
			phone: "Телефон",
			no_phone: "-",
			actions: "Дополнительно",
			view: "Подробнее",
			contact: "Контактная информация",
			search: "Поиск...",
			positive: "Нам должны",
			negative: "Мы должны",
		},
		product: {
			detail: "Продукты",
			search: "Поиск...",
			name: "Продукт",
			type: "Тип",
			symbol: "Ед. изм",
			currency: "Валюта",
			article: "Артикул",
			box: "Коробка",
			extra: "Дополнительный",
			view: "Более",
			main: "Главная",
			stock: "Склад",
			price: "Цена",
			barcodes: "Штрих-коды",
			quantity: "Количество",
			sale: "Распродажа",
			not_available: "Пока недоступно",
			loading: "Загрузка",
		},
		settingsUsers: {
			users: "Пользователи",
			active: "Актив",
			current: "Текущий пользователь",
			currentDevice: "Текущий",
			others: "Другие пользователи",
			security: "Безопасность",
			recovery: "Синхронизация",
			logout: "Выйти",
			currenctPass: "Текущий пароль",
			newPassword: "Новый пароль",
			confirmNewPassword: "Подтвердите новый пароль",
			updatePassword: "Изменять",
			recoveryYourInformation: "Восстановите ваши данные",
			recoveryNow: "Восстановление",
			recoveryEnterYourPassword:
				"Введите пароль ниже, чтобы восстановить вашу информацию.",
			recoveryProcessingRequest: "Процесс продолжается...",
			recoveryDataSuccess:
				"Восстановление прошло успешно! Ваши данные восстановлены. ",
		},
		salesPage: {
			headerClients: "Клиенты",
			headerDiscount: "Скидка",
			headerList: "Список продаж",
			headerListSubText: "Для управления продажами",
			headerListSearch: "Поиск по имени, складу или сумме...",
			headerListDateSelect: "Выберите дату",
			headerListFilter: "Фильтры",
			headerListFilterClear: "Очистка фильтров",
			headerListFound: "Найдено:",
			headerListFilterStatus: "Фильтр по статусу",
			headerListFilterStatusPending: "В процессе",
			headerListFilterStatusSucess: "Подтвержденный",
			headerListFilterStatusNotSuccess: "Неподтвержденный",
			headerListFilterStatusError: "Произошла ошибка.",
			headerListTableDate: "Дата",
			headerListTableDWarehouse: "Склад",
			headerListTableClient: "Клиент",
			headerListTableSumma: "Сумма",
			headerListTableStatus: "Статус",
			headerListTableAvtor: "Автор",
			headerListTableActions: "Более",
			headerListTableMain: "Основной",
			headerDiscountSumma: "Сумма",
			headerDiscountToPay: "К оплате",
			headerDiscountCancel: "Отмена",
			soldName: "Наименование",
			soldCount: "Количество",
			soldPrice: "Цена",
			soldSumma: "Сумма",
			soldNoProduct: "Пока нет продуктов",
			sidebarCash: "Наличные",
			sidebarCashPay: "Оплата",
			sidebarCashToPay: "К оплате",
			sidebarCashNoPermit: "В оставшейся сумме есть ошибка.",
			sidebarCashCash: "Наличные",
			sidebarCashCard: "Пластик",
			sidebarCashTotalPrice: "Сдача сумма",
			sidebarCashComment: "Комментарии",
			sidebarCard: "Онлайн",
			sidebarProcess: "Отложенная продаж ",
			footerExit: "Выход",
			footerExitConfirm: "Хотите выйти из окна продаж?",
			footerExitYes: "Да, выход",
			footerNewSales: "Новое продаж",
			saleSearch: "Поиск",
			saleDeleteConfirm: "Хотите очистить все выбранные продукты?",
			saleDeleteYes: "Да, очистить",
			saleTableName: "Наименование",
			saleTableCurrency: "Валюта",
			saleTableOstatka: "Остатка",
			saleTablePriceCurrency: "Цена, Валюта",
			saleTablePrice: "Цена",
			saleTableWarehouse: "Склад",
			saleModalCount: "Количество",
			saleModalNotEnough: "Осталось недостаточно.",
			sidebarClientSelect: "Выбрать клиента",
			sidebarClientSearch: "Поиск",
		},
		headerProfile: {
			settings: "Настройки",
			configure: "Настройте свой аккаунт",
			logout: "Выход",
			logtext: "Выйти из аккаунта",
			lastSync: "Последняя синхронизация: ",
		},
		changePassword: {
			noInternet: "Нет подключения к Интернету",
			noInternetText:
				"Пожалуйста, подключитесь к Интернету, чтобы изменить свой пароль.",
			internetRequiredToChange:
				"Пожалуйста, подключитесь к Интернету, чтобы изменить свой пароль.",
			requiredField: "Все поля должны быть заполнены.",
			newPasswordNotMatch:
				"Новый пароль и подтверждение пароля не совпадают.",
			oldPasswordWrong: "Текущий пароль неверный.",
			changeSuccess: "Пароль успешно изменен.",
			errorToast: "Ошибка. При смене пароля произошла ошибка.",
		},
		exit: {
			exit: "Выход",
			exitTest: "Хотите завершить работу в программе?",
		},
		firstSync: {
			downloadSettings: "Начать синхронизацию",
			clickToBelow: "Загрузите свои исходные данные",
			startSync: "Начать",
			pleaseWait: "Пожалуйста подождите, процесс продолжается",
			syncComplete: "Синхронизация закончена",
			dataSuccessfullySynced: "Ваши данные были успешно синхронизированы",
			syncFailed: "Ошибка во время процесса синхронизации",
			deviceAlreadyRegistered: "Это пользователь уже зарегистрировано.",
			tryAgain: "Попробуйте еще раз.",
			goToKSB: "Выйти из KSB-ID",
			noInternet: "Нет подключения к Интернету",
			pleaseCheck:
				"Чтобы синхронизировать ваши исходные данные, вам необходимо подключиться к Интернету. ",
		},
		settingsDevice: {
			autoSendSales: "Автоматически отправлять продажи",
			setTimeToSend: "Выберите время для автоматической отправки продажи",
			currentSendTime: "Текущее время",
			newSendTime:
				"Автоматическая отправка продажи изменена на новое время: ",
			timeoutSettings: "Настройки TimeOut",
			setTimeoutForYou: "Введите время для TimeOut (в секундах).",
			saveTimeout: "Сохранить",
			timeoutSaved: "Новое время сохранено для TimeOut: ",
		},
		itsDeadlineModal: {
			yourITS: "Срок действия вашего ITS истек!",
			updateITS: "Пожалуйста, обновите подписку.",
			exitProgram: "Выйти из программы",
		},
		permissionModal: {
			tasdiqlandi: "Одобренный",
			haliBeriTasdiqlanmadi: "Это устройство пока не подтверждено.",
			qurilmaTopilmadi: "Устройство не найдено.",
			qurilmadaXatolik: "Ошибка аутентификации устройства.",
			dasturdanChiqish: "Выйти из программы",
			ksbidDanChiqish: "Выйти из KSB-ID",
			qaytaUrinish: "Перепроверьте",
		},
		paymentModal: {
			printCheck: "Печатаете ли вы чек при продаже?",
			yes: "Да",
			no: "Нет",
			processSales: "",
			success: "",
			problemToSendSales: "Продажа не отправлена",
		},
		innerFooter: {
			its: "До окончания технической поддержки (ITS) осталось ${timeLeft}. Для дополнительной информации: +998 78 298 09 99",
		},
		summaSection: {
			summa: "Продажа",
			discount: "Скидка",
			toPay: "К оплате",
		},
		trashSales: {
			deletedSales: "Удаленные продажи",
			deletedSalesText: "Окно управления удаленными продажами",
			status: "Статус",
			client: "Клиент",
			totalPrice: "Сумма",
			seller: "Продавец",
			deletedAt: "Удаленное время",
			error: "Ошибка",
			actions: "Действия",
			noTrashSalesFound:
				"Удаленные продажи в настоящее время недоступны.",
		},
	},
};

export default content;

