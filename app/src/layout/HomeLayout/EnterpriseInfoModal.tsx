import { FC, useEffect, useRef, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { FaServer, FaDatabase, FaShieldAlt } from "react-icons/fa";
import moment from "moment";
import "moment/locale/ru";
import { NavLink } from "react-router-dom";
import { UpdateCheckModal } from "./UpdateCheckModal";
import { TbVersionsFilled } from "react-icons/tb";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

moment.locale("ru");

interface EnterpriseInfoModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const EnterpriseInfoModal: FC<EnterpriseInfoModalProps> = ({
	isOpen,
	onClose,
}) => {
	const ipaddressPort = localStorage.getItem("ipaddress:port");
	const mainDatabase = localStorage.getItem("mainDatabase");
	const itsDeadline = localStorage.getItem("its_deadline");

	const device_id = localStorage.getItem("device_id");

	const [language] = useLang();

	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose]);

	const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

	const infoItems = [
		// { icon: FaServer, label: "Сервер", value: ipaddressPort },
		{
			icon: FaDatabase,
			label: "Датабаза",
			value: mainDatabase,
		},
		{
			icon: FaShieldAlt,
			label: "ИТС",
			value: `${moment(itsDeadline).format("LL")}`,
		},
		{
			icon: TbVersionsFilled,
			label: "Версия",
			value: `1.0.0`,
		},
		{
			icon: TbVersionsFilled,
			label: "Устройство-ID",
			value: device_id,
			textOnly: true,
		},
	];

	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			/>
			<div
				ref={modalRef}
				className="absolute top-8 w-[350px] right-20 w-84 bg-slate-100 rounded-lg shadow-xl transform transition-all duration-200 scale-100 z-[9998] border border-slate-200"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				<div className="p-3">
					<div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
						<h2 className="text-sm font-semibold text-slate-800">
							{content[language as string].enterpriseInfo.infos}
						</h2>
						<button
							onClick={onClose}
							className="text-slate-500 hover:text-slate-700 transition-colors p-1 hover:bg-slate-200 rounded-full"
						>
							<IoCloseOutline className="w-4 h-4" />
						</button>
					</div>

					<div className="space-y-2">
						{infoItems.map(
							({ icon: Icon, label, value, textOnly }) =>
								textOnly ? (
									<div
										key={label}
										className="p-2.5 bg-white flex items-center rounded-md border border-slate-200"
									>
										<div className="flex-shrink-0">
											<Icon className="w-4 h-4 text-blue-500" />
										</div>
										<div className="ml-3 min-w-0">
											<p className="text-xs font-medium text-slate-500 mb-0.5">
												{label}
											</p>
											<p className="text-xs font-semibold text-slate-900 truncate">
												{value}
											</p>
										</div>
									</div>
								) : (
									<div
										key={label}
										className="flex items-center p-2.5 bg-white rounded-md hover:bg-slate-50 transition-colors border border-slate-200"
									>
										<div className="flex-shrink-0">
											<Icon className="w-4 h-4 text-blue-500" />
										</div>
										<div className="ml-3 min-w-0">
											<p className="text-xs font-medium text-slate-500 mb-0.5">
												{label}
											</p>
											<p className="text-sm font-semibold text-slate-900 truncate">
												{value}
											</p>
										</div>
									</div>
								),
						)}
					</div>
					<hr className="mt-2 text-slate-500" />

					<div className="mt-2 mx-auto justify-left block flex text-black">
						<NavLink
							to="/intro"
							className="mt-3 px-3 py-2 bg-slate-300 hover:bg-slate-400 text-black rounded-md text-xs font-medium transition-colors"
						>
							{content[language as string].enterpriseInfo.signout}
						</NavLink>
						{/* <button
							onClick={() => setIsUpdateModalOpen(true)}
							className="mt-3 relative ml-3 px-3 py-2 bg-slate-300 hover:bg-slate-400 text-black rounded-md text-xs font-medium transition-colors"
						>
							<span
								style={{
									position: "absolute",
									top: "0",
									left: "0",
									width: "8px",
									height: "8px",
									backgroundColor: "orange",
									borderRadius: "50%",
									border: "",
									transform: "translate(-50%, -30%)", // Adjust to center the dot on the corner
								}}
							></span>
							{content[language as string].enterpriseInfo.update}
						</button> */}
					</div>
				</div>
			</div>
			<UpdateCheckModal
				isOpen={isUpdateModalOpen}
				onClose={() => setIsUpdateModalOpen(false)}
			/>
		</>
	);
};

