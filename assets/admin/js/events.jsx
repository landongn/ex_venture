import React from 'react';

class BaseEffect extends React.Component {
  constructor(props) {
    super(props);

    this.handleUpdateField = this.handleUpdateField.bind(this);
  }

  handleUpdateField(field) {
    return (event) => {
      let value = event.target.value;
      this.setState({[field]: value});

      let effect = Object.assign(this.state, {[field]: value});
      this.props.handleUpdate(effect);
    }
  }
}

class DamageEffect extends BaseEffect {
  constructor(props) {
    super(props);

    let effect = props.effect;

    this.state = {
      kind: "damage",
      type: effect.type,
      amount: effect.amount,
    };

    this.handleUpdateField = this.handleUpdateField.bind(this);
  }

  render() {
    let type = this.state.type;
    let amount = this.state.amount;

    return (
      <div className="form-group row">
        <label className="col-md-4">Kind: damage</label>
        <div className="col-md-8">
          <div className="row">
            <div className="col-md-4">
              <label>Damage Type</label>
              <input type="text" value={type} className="form-control" onChange={this.handleUpdateField("type")} />
            </div>

            <div className="col-md-4">
              <label>Amount</label>
              <input type="number" value={amount} className="form-control" onChange={this.handleUpdateField("amount")} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class DamageTypeEffect extends React.Component {
  constructor(props) {
    super(props);

    let effect = props.effect;

    this.state = {
      types: effect.types,
      newType: "",
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleNewType = this.handleNewType.bind(this);

    this.addType = this.addType.bind(this);
    this.removeType = this.removeType.bind(this);
  }

  handleNewType(event) {
    let value = event.target.value;
    this.setState({newType: value});
  }

  handleKeyPress(event) {
    if (event.key == 'Enter') {
      event.preventDefault();
      this.addType(event);
    }
  }

  addType(event) {
    event.preventDefault();

    let newType = this.state.newType;

    if (newType != "") {
      let types = [newType, ...this.state.types];
      this.setState({
        types: types,
        newType: "",
      });
      this.props.handleUpdate({
        kind: "damage/type",
        types: types,
      });
    }
  }

  removeType(type) {
    let types = this.state.types;
    let index = types.indexOf(type);
    types.splice(index, 1);
    this.setState({
      types: types,
    })
  }

  render() {
    let types = this.state.types;
    let removeType = this.removeType;

    return (
      <div className="form-group row">
        <label className="col-md-4">Kind: damage/type</label>
        <div className="col-md-8">
          <ul>
            {types.map(function(type, index) {
              return (
                <li key={index}>
                  {type}
                  <i onClick={() => removeType(type)} style={{paddingLeft: "15px"}} className="fa fa-times"></i>
                </li>
              );
            })}
          </ul>
          <input type="text" value={this.state.newType} className="form-control" onKeyPress={this.handleKeyPress} onChange={this.handleNewType} />
          <a href="#" onClick={this.addType} className="btn btn-primary" style={{marginTop: "10px"}}>Add</a>
        </div>
      </div>
    );
  }
}

class DamageOverTimeEffect extends BaseEffect {
  constructor(props) {
    super(props);

    let effect = props.effect;

    this.state = {
      kind: "damage/over-time",
      type: effect.type,
      amount: effect.amount,
      every: effect.amount,
      count: effect.amount,
    };
  }

  render() {
    let type = this.state.type;
    let amount = this.state.amount;
    let every = this.state.every;
    let count = this.state.count;

    return (
      <div className="form-group row">
        <label className="col-md-4">Kind: damage/over-time</label>
        <div className="col-md-8">
          <div className="row">
            <div className="col-md-4">
              <label>Damage Type</label>
              <input type="text" value={type} className="form-control" onChange={this.handleUpdateField("type")} />
            </div>
            <div className="col-md-4">
              <label>Amount</label>
              <input type="text" value={amount} className="form-control" onChange={this.handleUpdateField("amount")} />
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <label>Every X ms</label>
              <input type="text" value={every} className="form-control" onChange={this.handleUpdateField("every")} />
            </div>
            <div className="col-md-4">
              <label>Count</label>
              <input type="text" value={count} className="form-control" onChange={this.handleUpdateField("count")} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class RecoverEffect extends BaseEffect {
  constructor(props) {
    super(props);

    let effect = props.effect;

    this.state = {
      kind: "recover",
      type: effect.type,
      amount: effect.amount,
    };
  }

  render() {
    let type = this.state.type;
    let amount = this.state.amount;

    return (
      <div className="form-group row">
        <label className="col-md-4">Kind: damage</label>
        <div className="col-md-8">
          <div className="row">
            <div className="col-md-4">
              <label>Stat to Recover</label>
              <input type="text" value={type} className="form-control" onChange={this.handleUpdateField("type")} />
            </div>

            <div className="col-md-4">
              <label>Amount</label>
              <input type="number" value={amount} className="form-control" onChange={this.handleUpdateField("amount")} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Effect extends React.Component {
  constructor(props) {
    super(props);

    this.handleUpdate = this.handleUpdate.bind(this);
  }

  handleUpdate(effect) {
    this.props.handleUpdate(effect, this.props.index);
  }

  render() {
    let effect = this.props.effect;
    let handleUpdate = this.handleUpdate;

    switch (effect.kind) {
      case "damage":
        return (
          <DamageEffect effect={effect} handleUpdate={handleUpdate} />
        );

      case "damage/type":
        return (
          <DamageTypeEffect effect={effect} handleUpdate={handleUpdate} />
        );

      case "damage/over-time":
        return (
          <DamageOverTimeEffect effect={effect} handleUpdate={handleUpdate} />
        );

      case "recover":
        return (
          <RecoverEffect effect={effect} handleUpdate={handleUpdate} />
        );

      default:
        return (
          <div>Missing an effect: <b>{effect.kind}</b></div>
        );
    }
  }
}

class AddEffect extends React.Component {
  constructor(props) {
    super(props);

    this.addDamage = this.addDamage.bind(this);
    this.addDamageType = this.addDamageType.bind(this);
    this.addDamageOverTime = this.addDamageOverTime.bind(this);
    this.addRecover = this.addRecover.bind(this);
  }

  addDamage(event) {
    event.preventDefault();

    this.props.addEffect({
      kind: "damage",
      type: "slashing",
      amount: 10,
    });
  }

  addDamageType(event) {
    event.preventDefault();

    this.props.addEffect({
      kind: "damage/type",
      types: ["slashing"],
    });
  }

  addDamageOverTime(event) {
    event.preventDefault();

    this.props.addEffect({
      kind: "damage/over-time",
      type: "slashing",
      amount: 10,
      every: 1000,
      count: 3,
    });
  }

  addRecover(event) {
    event.preventDefault();

    this.props.addEffect({
      kind: "recover",
      type: "health",
      amount: 10,
    });
  }

  render() {
    return (
      <div>
        <a href="#" className="btn btn-default" onClick={this.addDamage}>Add 'damage'</a>
        <a href="#" className="btn btn-default" onClick={this.addDamageType}>Add 'damage/type'</a>
        <a href="#" className="btn btn-default" onClick={this.addDamageOverTime}>Add 'damage/over-time'</a>
        <a href="#" className="btn btn-default" onClick={this.addRecover}>Add 'recover'</a>
      </div>
    );
  }
}

export default class Effects extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      effects: props.effects,
    }

    this.handleUpdate = this.handleUpdate.bind(this);
    this.addEffect = this.addEffect.bind(this);
  }

  handleUpdate(effect, index) {
    let effects = this.state.effects;
    effects[index] = effect;
    this.setState({
      effects: effects,
    });
  }

  addEffect(effect) {
    this.setState({effects: [...this.state.effects, effect]});
  }

  render() {
    let effects = this.state.effects;
    let handleUpdate = this.handleUpdate;

    let effectsJSON = JSON.stringify(effects);

    return (
      <div>
        <input type="hidden" name="skill[effects]" value={effectsJSON} />

        {effects.map(function (effect, index) {
          return (
            <div key={index}>
              <Effect effect={effect} index={index} handleUpdate={handleUpdate} />
              <hr />
            </div>
          );
        })}

        <AddEffect addEffect={this.addEffect} />
      </div>
    );
  }
}
