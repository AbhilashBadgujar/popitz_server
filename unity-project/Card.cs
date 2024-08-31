// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.35
// 

using Colyseus.Schema;
using Action = System.Action;
#if UNITY_5_3_OR_NEWER
using UnityEngine.Scripting;
#endif

public partial class Card : Schema {
#if UNITY_5_3_OR_NEWER
[Preserve] 
#endif
public Card() { }
	[Type(0, "uint16")]
	public ushort health = default(ushort);

	[Type(1, "boolean")]
	public bool isDisabled = default(bool);

	/*
	 * Support for individual property change callbacks below...
	 */

	protected event PropertyChangeHandler<ushort> __healthChange;
	public Action OnHealthChange(PropertyChangeHandler<ushort> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.health));
		__healthChange += __handler;
		if (__immediate && this.health != default(ushort)) { __handler(this.health, default(ushort)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(health));
			__healthChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<bool> __isDisabledChange;
	public Action OnIsDisabledChange(PropertyChangeHandler<bool> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.isDisabled));
		__isDisabledChange += __handler;
		if (__immediate && this.isDisabled != default(bool)) { __handler(this.isDisabled, default(bool)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(isDisabled));
			__isDisabledChange -= __handler;
		};
	}

	protected override void TriggerFieldChange(DataChange change) {
		switch (change.Field) {
			case nameof(health): __healthChange?.Invoke((ushort) change.Value, (ushort) change.PreviousValue); break;
			case nameof(isDisabled): __isDisabledChange?.Invoke((bool) change.Value, (bool) change.PreviousValue); break;
			default: break;
		}
	}
}

