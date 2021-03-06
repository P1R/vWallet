import * as React from 'react'
import Modal from '../Modal'
import SendState from '../../utils/SendState'
import AmountInput from '../transaction/AmountInput'
import BalanceBar from '../transaction/BalanceBar'
import SendTransactionButton from '../transaction/SendTransactionButton'
import NoBalancePanel from './NoBalancePanel'
import GiftIcon from 'react-material-icon-svg/dist/GiftIcon'
import { inject, observer } from 'mobx-react'
import { translate, Trans } from 'react-i18next'
import { CoinStatsStore } from '../../stores/CoinStatsStore'
import { AccountInformationStore } from '../../stores/AccountInformationStore'
import { SettingsStore } from '../../stores/SettingsStore'
import { i18n } from 'i18next'
import Fee from '../../utils/Fee'

const XVG_DONATION_ADDRESS = 'D7KV88Zg2XNHUtX1DYhMsoHRz1RG9xGSmM'

interface DonatePanelInterface {
  open: boolean
  toggle: () => void
  AccountInformationStore?: AccountInformationStore
  CoinStatsStore?: CoinStatsStore
  SettingsStore?: SettingsStore
  i18n?: i18n
}

interface DonatePanelState {
  amount: number
  status: SendState
  error: string | null
}

class DonatePanel extends React.Component<DonatePanelInterface, DonatePanelState> {
  state = {
    amount: 0,
    status: SendState.OPEN,
    error: null,
  }

  getLocaleId() {
    return this.props.SettingsStore!.getLocale
  }

  getPrice() {
    return this.props.CoinStatsStore!.priceWithCurrency
  }

  amountChanged(amount) {
    this.setState({ amount })
  }

  balanceToLow() {
    return (this.props.AccountInformationStore!.getBalance - Fee) <= 0
  }

  sendTransaction() {
    const { amount } = this.state
    const { AccountInformationStore } = this.props

    if (!amount || !AccountInformationStore) return

    this.setState({ status: SendState.SENDING, error: null })
    setTimeout(() => {
      AccountInformationStore.sendTransaction(XVG_DONATION_ADDRESS, amount)
        .then(() => {
          setTimeout(() => {
            this.setState({ status: SendState.DONE })
            setTimeout(() => {
              this.props.toggle()
              this.setState({
                amount: 0,
                status: SendState.OPEN,
              })
            }, 1000)
          }, 500)
        })
        .catch(e => {
          this.setState({
            status: SendState.ERROR,
            error: JSON.parse(e).error.message,
          })
          setTimeout(() => {
            this.setState({
              status: SendState.OPEN,
              error: null,
            })
          }, 2500)
        })
    }, 1000)
  }

  render() {
    if (this.balanceToLow()) {
      return (
        <NoBalancePanel
          {...this.props}
          title={this.props.i18n!.t('donatePanel.title') as string}
          className="donate-modal"
        />
      )
    }

    return (
      <Modal
        {...this.props}
        title={this.props.i18n!.t('donatePanel.title')}
        className="donate-modal"
      >
        <p className="donate-description donate-description-larger">
          <Trans i18nKey="donatePanel.descriptionHead" />
        </p>
        <p  className="donate-description">
          <Trans i18nKey="donatePanel.descriptionFoot" />
        </p>
        <div className="form-separator" />
        <label className="form-label">
          <Trans i18nKey="donatePanel.donationXvgAddress" />
        </label>
        <input
          className="form-input"
          value={XVG_DONATION_ADDRESS}
          disabled
        />
        <p className="form-input-help">
          <Trans i18nKey="donatePanel.donationXvgAddressHelp" />
        </p>
        <AmountInput amount={this.state.amount} amountChanged={this.amountChanged.bind(this)}/>
        <div className="form-separator"/>
        <BalanceBar />
        <div style={{ marginBottom: '15px' }}>
          <SendTransactionButton
            label={this.props.i18n!.t('donatePanel.donateXvg')}
            status={this.state.status}
            amount={this.state.amount}
            price={this.getPrice()}
            localeId={this.getLocaleId()}
            error={this.state.error}
            onClick={this.sendTransaction.bind(this)}
          >
            <GiftIcon
              width={22}
              height={22}
              style={{ fill: '#fff', marginRight: '5px' }}
            />
          </SendTransactionButton>
        </div>
      </Modal>
    )
  }
}

export default translate()(
  inject('SettingsStore', 'CoinStatsStore', 'AccountInformationStore')(
    observer(DonatePanel),
  ),
)
