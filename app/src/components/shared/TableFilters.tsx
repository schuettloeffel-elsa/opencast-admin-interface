import React, { createRef, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
	getCurrentFilterResource,
	getFilters,
	getSecondFilter,
	getSelectedFilter,
	getTextFilter,
} from "../../selectors/tableFilterSelectors";
import {
	editFilterValue,
	editSecondFilter,
	editSelectedFilter,
	editTextFilter,
	removeSecondFilter,
	removeSelectedFilter,
	removeTextFilter,
	resetFilterValues,
} from "../../actions/tableFilterActions";
import TableFilterProfiles from "./TableFilterProfiles";
import { availableHotkeys } from "../../configs/hotkeysConfig";
import { GlobalHotKeys } from "react-hotkeys";
import { getResourceType } from "../../selectors/tableSelectors";
import { fetchFilters } from "../../thunks/tableFilterThunks";
import { parseISO } from "date-fns";
import moment from "moment";

/**
 * This component renders the table filters in the upper right corner of the table
 */
const TableFilters = ({
// @ts-expect-error TS(7031): Binding element 'filterMap' implicitly has an 'any... Remove this comment to see the full error message
	filterMap,
// @ts-expect-error TS(7031): Binding element 'textFilter' implicitly has an 'an... Remove this comment to see the full error message
	textFilter,
// @ts-expect-error TS(7031): Binding element 'selectedFilter' implicitly has an... Remove this comment to see the full error message
	selectedFilter,
// @ts-expect-error TS(7031): Binding element 'secondFilter' implicitly has an '... Remove this comment to see the full error message
	secondFilter,
// @ts-expect-error TS(7031): Binding element 'onChangeTextFilter' implicitly ha... Remove this comment to see the full error message
	onChangeTextFilter,
// @ts-expect-error TS(7031): Binding element 'removeTextFilter' implicitly has ... Remove this comment to see the full error message
	removeTextFilter,
// @ts-expect-error TS(7031): Binding element 'editSelectedFilter' implicitly ha... Remove this comment to see the full error message
	editSelectedFilter,
// @ts-expect-error TS(7031): Binding element 'removeSelectedFilter' implicitly ... Remove this comment to see the full error message
	removeSelectedFilter,
// @ts-expect-error TS(7031): Binding element 'removeSecondFilter' implicitly ha... Remove this comment to see the full error message
	removeSecondFilter,
// @ts-expect-error TS(7031): Binding element 'resetFilterMap' implicitly has an... Remove this comment to see the full error message
	resetFilterMap,
// @ts-expect-error TS(7031): Binding element 'editFilterValue' implicitly has a... Remove this comment to see the full error message
	editFilterValue,
// @ts-expect-error TS(7031): Binding element 'loadResource' implicitly has an '... Remove this comment to see the full error message
	loadResource,
// @ts-expect-error TS(7031): Binding element 'loadResourceIntoTable' implicitly... Remove this comment to see the full error message
	loadResourceIntoTable,
// @ts-expect-error TS(7031): Binding element 'resource' implicitly has an 'any'... Remove this comment to see the full error message
	resource,
}) => {
	const { t } = useTranslation();

	// Variables for showing different dialogs depending on what was clicked
	const [showFilterSelector, setFilterSelector] = useState(false);
	const [showFilterSettings, setFilterSettings] = useState(false);

	// Variables containing selected start date and end date for date filter
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);

	// Remove all selected filters, no filter should be "active" anymore
	const removeFilters = async () => {
		// Clear state
		setStartDate(undefined);
		setEndDate(undefined);

		removeTextFilter();
		removeSelectedFilter();
		removeSelectedFilter();

		// Set all values of the filters in filterMap back to ""
		resetFilterMap();

		// Reload resources when filters are removed
		await loadResource();
		loadResourceIntoTable();
	};

	// Remove a certain filter
// @ts-expect-error TS(7006): Parameter 'filter' implicitly has an 'any' type.
	const removeFilter = async (filter) => {
		if (filter.name === "startDate") {
			// Clear state
			setStartDate(undefined);
			setEndDate(undefined);
		}

		editFilterValue(filter.name, "");

		// Reload resources when filter is removed
		await loadResource();
		loadResourceIntoTable();
	};

	// Handle changes when a item of the component is clicked
// @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
	const handleChange = async (e) => {
		const itemName = e.target.name;
		const itemValue = e.target.value;

		if (itemName === "textFilter") {
			onChangeTextFilter(itemValue);
		}

		if (itemName === "selectedFilter") {
			editSelectedFilter(itemValue);
		}

		// If the change is in secondFilter (filter is picked) then the selected value is saved in filterMap
		// and the filter selections are cleared
		if (itemName === "secondFilter") {
// @ts-expect-error TS(7031): Binding element 'name' implicitly has an 'any' typ... Remove this comment to see the full error message
			let filter = filterMap.find(({ name }) => name === selectedFilter);
			editFilterValue(filter.name, itemValue);
			setFilterSelector(false);
			removeSelectedFilter();
			removeSecondFilter();
		}
		// Reload of resource
		await loadResource();
		loadResourceIntoTable();
	};

	// Set the sate of startDate and endDate picked with datepicker
	const handleDatepickerChange = async (date: Date, isStart = false) => {
		if (isStart) {
			setStartDate(date);
		} else {
			setEndDate(date);
		}
	};

	// If both dates are set, set the value for the startDate filter
	// If the just changed, it can be passed here so we don't have wait a render
	// cycle for the useState state to update
	const handleDatepickerConfirm = async (date?: Date, isStart = false) => {
		let myStartDate = startDate;
		let myEndDate = endDate;
		if (date && isStart) {
			myStartDate = date;
			myStartDate.setHours(0);
			myStartDate.setMinutes(0);
			myStartDate.setSeconds(0);
		}
		if (date && !isStart) {
			myEndDate = date;
			myEndDate.setHours(23);
			myEndDate.setMinutes(59);
			myEndDate.setSeconds(59);
		}

		if (myStartDate && myEndDate && moment(myStartDate).isValid() && moment(myEndDate).isValid()) {
// @ts-expect-error TS(7031): Binding element 'name' implicitly has an 'any' typ... Remove this comment to see the full error message
			let filter = filterMap.find(({ name }) => name === selectedFilter);
			await editFilterValue(
				filter.name,
				myStartDate.toISOString() + "/" + myEndDate.toISOString()
			);
			setFilterSelector(false);
			removeSelectedFilter();
			// Reload of resource
			await loadResource();
			loadResourceIntoTable();
		}

		if (myStartDate && isStart && !endDate) {
			setEndDate(myStartDate);
		}
		if (myEndDate && !isStart && !startDate) {
			setStartDate(myEndDate);
		}
	}

	const hotKeyHandlers = {
		REMOVE_FILTERS: removeFilters,
	};

// @ts-expect-error TS(7006): Parameter 'filter' implicitly has an 'any' type.
	const renderBlueBox = (filter) => {
// @ts-expect-error TS(7006): Parameter 'opt' implicitly has an 'any' type.
		let valueLabel = filter.options.find((opt) => opt.value === filter.value)
			.label;
		return (
			<span>
				{t(filter.label).substr(0, 40)}:
				{filter.translatable
					? t(valueLabel).substr(0, 40)
					: valueLabel.substr(0, 40)}
			</span>
		);
	};

	return (
		<>
			<GlobalHotKeys
// @ts-expect-error TS(2769): No overload matches this call.
				keyMap={availableHotkeys.general}
				handlers={hotKeyHandlers}
			/>
			<div className="filters-container">
				{/* Text filter - Search Query */}
				<input
					type="text"
					className="search expand"
// @ts-expect-error TS(2322): Type 'DefaultTFuncReturn' is not assignable to typ... Remove this comment to see the full error message
					placeholder={t("TABLE_FILTERS.PLACEHOLDER")}
					onChange={(e) => handleChange(e)}
					name="textFilter"
					value={textFilter}
				/>

				{/* Selection of filters and management of filter profiles*/}
				{/*show only if filters.filters contains filters*/}
				{!!filterMap && (
					<div className="table-filter">
						<div className="filters">
							<i
// @ts-expect-error TS(2322): Type 'DefaultTFuncReturn' is not assignable to typ... Remove this comment to see the full error message
								title={t("TABLE_FILTERS.ADD")}
								className="fa fa-filter"
								onClick={() => setFilterSelector(!showFilterSelector)}
							/>

							{/*show if icon is clicked*/}
							{showFilterSelector && (
								<div>
									{/*Check if filters in filtersMap and show corresponding selection*/}
									{!filterMap || false ? (
										// Show if no filters in filtersList
										<select
// @ts-expect-error TS(2322): Type 'DefaultTFuncReturn' is not assignable to typ... Remove this comment to see the full error message
											defaultValue={t(
												"TABLE_FILTERS.FILTER_SELECTION.NO_OPTIONS"
											)}
											className="main-filter"
										>
											<option disabled>
												{t("TABLE_FILTERS.FILTER_SELECTION.NO_OPTIONS")}
											</option>
										</select>
									) : (
										// Show all filtersMap as selectable options
										<select
// @ts-expect-error TS(2322): Type '{ children: any[]; disable_search_threshold:... Remove this comment to see the full error message
											disable_search_threshold="10"
											onChange={(e) => handleChange(e)}
											value={selectedFilter}
											name="selectedFilter"
											className="main-filter"
										>
											<option value="" disabled>
												{t("TABLE_FILTERS.FILTER_SELECTION.PLACEHOLDER")}
											</option>
											{filterMap
												.filter(
// @ts-expect-error TS(7006): Parameter 'filter' implicitly has an 'any' type.
													(filter) => filter.name !== "presentersBibliographic"
												)
// @ts-expect-error TS(7006): Parameter 'filter' implicitly has an 'any' type.
												.map((filter, key) => (
													<option key={key} value={filter.name}>
														{t(filter.label).substr(0, 40)}
													</option>
												))}
										</select>
									)}
								</div>
							)}

							{/*Show selection of secondary filter if a main filter is chosen*/}
							{!!selectedFilter && (
								<div>
									{/*Show the secondary filter depending on the type of main filter chosen (select or period)*/}
									<FilterSwitch
										filterMap={filterMap}
										selectedFilter={selectedFilter}
										secondFilter={secondFilter}
										startDate={startDate}
										endDate={endDate}
										handleDate={handleDatepickerChange}
										handleDateConfirm={handleDatepickerConfirm}
										handleChange={handleChange}
									/>
								</div>
							)}

							{/* Show for each selected filter a blue label containing its name and option */}
{/* @ts-expect-error TS(7006): Parameter 'filter' implicitly has an 'any' type. */}
							{filterMap.map((filter, key) => {
								if (!!filter.value) {
									return (
										<span className="ng-multi-value" key={key}>
											<span>
												{
													// Use different representation of name and value depending on type of filter
													filter.type === "select" ? (
														renderBlueBox(filter)
													) : filter.type === "period" ? (
														<span>
															<span>
																{t(filter.label).substr(0, 40)}:
																{t("dateFormats.date.short", {
																	date: new Date(filter.value.split("/")[0]),
																})}
																-
																{t("dateFormats.date.short", {
																	date: new Date(filter.value.split("/")[1]),
																})}
															</span>
														</span>
													) : null
												}
											</span>
											{/* Remove icon in blue area around filter */}
											<button
// @ts-expect-error TS(2322): Type 'DefaultTFuncReturn' is not assignable to typ... Remove this comment to see the full error message
												title={t("TABLE_FILTERS.REMOVE")}
												onClick={() => removeFilter(filter)}
                        className="button-like-anchor"
											>
												<i className="fa fa-times" />
											</button>
										</span>
									);
								}
							})}
						</div>

						{/* Remove icon to clear all filters */}
						<i
							onClick={removeFilters}
// @ts-expect-error TS(2322): Type 'DefaultTFuncReturn' is not assignable to typ... Remove this comment to see the full error message
							title={t("TABLE_FILTERS.CLEAR")}
							className="clear fa fa-times"
						/>
						{/* Settings icon to open filters profile dialog (save and editing filter profiles)*/}
						<i
							onClick={() => setFilterSettings(!showFilterSettings)}
// @ts-expect-error TS(2322): Type 'DefaultTFuncReturn' is not assignable to typ... Remove this comment to see the full error message
							title={t("TABLE_FILTERS.PROFILES.FILTERS_HEADER")}
							className="settings fa fa-cog fa-times"
						/>

						{/* Filter profile dialog for saving and editing filter profiles */}
						<TableFilterProfiles
							showFilterSettings={showFilterSettings}
							setFilterSettings={setFilterSettings}
							resource={resource}
							loadResource={loadResource}
							loadResourceIntoTable={loadResourceIntoTable}
						/>
					</div>
				)}
			</div>
		</>
	);
};

/*
 * Component for rendering the selection of options for the secondary filter
 * depending on the the type of the main filter. These types can be select or period.
 * In case of select, a second selection is shown. In case of period, datepicker are shown.
 */
const FilterSwitch = ({
// @ts-expect-error TS(7031): Binding element 'filterMap' implicitly has an 'any... Remove this comment to see the full error message
	filterMap,
// @ts-expect-error TS(7031): Binding element 'selectedFilter' implicitly has an... Remove this comment to see the full error message
	selectedFilter,
// @ts-expect-error TS(7031): Binding element 'handleChange' implicitly has an '... Remove this comment to see the full error message
	handleChange,
	// @ts-expect-error TS(7031):
	startDate,
	// @ts-expect-error TS(7031):
	endDate,
// @ts-expect-error TS(7031): Binding element 'handleDate' implicitly has an 'an... Remove this comment to see the full error message
	handleDate,
// @ts-expect-error TS(7031): Binding element 'handleDate' implicitly has an 'an... Remove this comment to see the full error message
	handleDateConfirm,
// @ts-expect-error TS(7031): Binding element 'secondFilter' implicitly has an '... Remove this comment to see the full error message
	secondFilter,
}) => {
	const { t } = useTranslation();

	const startDateRef = useRef<HTMLInputElement>(null);
	const endDateRef = useRef<HTMLInputElement>(null);

// @ts-expect-error TS(7031): Binding element 'name' implicitly has an 'any' typ... Remove this comment to see the full error message
	let filter = filterMap.find(({ name }) => name === selectedFilter);
	// eslint-disable-next-line default-case
	switch (filter.type) {
		case "select":
			return (
				<div>
					{/*Show only if selected main filter has translatable options*/}
					{filter.translatable ? (
						// Show if the selected main filter has no further options
						!filter.options || false ? (
							<select
// @ts-expect-error TS(2322): Type 'DefaultTFuncReturn' is not assignable to typ... Remove this comment to see the full error message
								defaultValue={t("TABLE_FILTERS.FILTER_SELECTION.NO_OPTIONS")}
								className="second-filter"
							>
								<option disabled>
									{t("TABLE_FILTERS.FILTER_SELECTION.NO_OPTIONS")}
								</option>
							</select>
						) : (
							// Show further options for a secondary filter
							<select
								className="second-filter"
								onChange={(e) => handleChange(e)}
								value={secondFilter}
								name="secondFilter"
							>
								<option value="" disabled>
									{t("TABLE_FILTERS.FILTER_VALUE_SELECTION.PLACEHOLDER")}
								</option>
{/* @ts-expect-error TS(7006): Parameter 'option' implicitly has an 'any' type. */}
								{filter.options.map((option, key) => (
									<option key={key} value={option.value}>
										{t(option.label).substr(0, 40)}
									</option>
								))}
							</select>
						)
					) : // Show only if the selected main filter has options that are not translatable (else case from above)
					!filter.options || false ? (
						// Show if the selected main filter has no further options
						<select
// @ts-expect-error TS(2322): Type 'DefaultTFuncReturn' is not assignable to typ... Remove this comment to see the full error message
							defaultValue={t("TABLE_FILTERS.FILTER_SELECTION.NO_OPTIONS")}
							className="second-filter"
						>
							<option disabled>
								{t("TABLE_FILTERS.FILTER_SELECTION.NO_OPTIONS")}
							</option>
						</select>
					) : (
						// Show further options for a secondary filter
						<select
							className="second-filter"
							onChange={(e) => handleChange(e)}
							value={secondFilter}
							name="secondFilter"
						>
							<option value="" disabled>
								{t("TABLE_FILTERS.FILTER_VALUE_SELECTION.PLACEHOLDER")}
							</option>
{/* @ts-expect-error TS(7006): Parameter 'option' implicitly has an 'any' type. */}
							{filter.options.map((option, key) => (
								<option key={key} value={option.value}>
									{option.label.substr(0, 40)}
								</option>
							))}
						</select>
					)}
				</div>
			);
		case "period":
			return (
				<div>
					{/* Show datepicker for start date */}
					<DatePicker
						autoFocus={true}
						inputRef={startDateRef}
						className="small-search start-date"
						value={startDate ?? {}}
						format="dd/MM/yyyy"
						onChange={(date) => handleDate(date, true)}
						onAccept={(e) => {handleDateConfirm(e, true)}}
						// onAccept does not trigger if the value did not change, therefore
						// we also need to callback in onClose
						onClose={() => handleDateConfirm()}
						slotProps={{
							textField: {
								onKeyDown: (event) => {
									if (event.key === "Enter") {
										handleDateConfirm(undefined, true)
										if (endDateRef.current && startDate && moment(startDate).isValid()) {
											endDateRef.current.focus();
										}
									}
								},
							},
						}}
					/>
					<DatePicker
						inputRef={endDateRef}
						className="small-search end-date"
						value={endDate ?? {}}
						format="dd/MM/yyyy"
						onChange={(date) => handleDate(date)}
						onAccept={(e) => handleDateConfirm(e, false)}
						// onAccept does not trigger if the value did not change, therefore
						// we also need to callback in onClose
						onClose={() => handleDateConfirm()}
						slotProps={{
							textField: {
								onKeyDown: (event) => {
									if (event.key === "Enter") {
										handleDateConfirm(undefined, false)
										if (startDateRef.current && endDate && moment(endDate).isValid()) {
											startDateRef.current.focus();
										}
									}
								},
							},
						}}
					/>
				</div>
			);
    // This should never happen
    default:
      return null;

	}
};

// Getting state data out of redux store
// @ts-expect-error TS(7006): Parameter 'state' implicitly has an 'any' type.
const mapStateToProps = (state) => ({
	textFilter: getTextFilter(state),
	filterMap: getFilters(state),
	selectedFilter: getSelectedFilter(state),
	secondFilter: getSecondFilter(state),
	resourceType: getResourceType(state),
	filterResourceType: getCurrentFilterResource(state),
});

// Mapping actions to dispatch
// @ts-expect-error TS(7006): Parameter 'dispatch' implicitly has an 'any' type.
const mapDispatchToProps = (dispatch) => ({
// @ts-expect-error TS(7006): Parameter 'textFilter' implicitly has an 'any' typ... Remove this comment to see the full error message
	onChangeTextFilter: (textFilter) => dispatch(editTextFilter(textFilter)),
	removeTextFilter: () => dispatch(removeTextFilter()),
// @ts-expect-error TS(7006): Parameter 'filter' implicitly has an 'any' type.
	editSelectedFilter: (filter) => dispatch(editSelectedFilter(filter)),
	removeSelectedFilter: () => dispatch(removeSelectedFilter()),
// @ts-expect-error TS(7006): Parameter 'filter' implicitly has an 'any' type.
	editSecondFilter: (filter) => dispatch(editSecondFilter(filter)),
	removeSecondFilter: () => dispatch(removeSecondFilter()),
	resetFilterMap: () => dispatch(resetFilterValues()),
// @ts-expect-error TS(7006): Parameter 'filterName' implicitly has an 'any' typ... Remove this comment to see the full error message
	editFilterValue: (filterName, value) =>
		dispatch(editFilterValue(filterName, value)),
// @ts-expect-error TS(7006): Parameter 'resource' implicitly has an 'any' type.
	loadingFilters: (resource) => dispatch(fetchFilters(resource)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TableFilters);
