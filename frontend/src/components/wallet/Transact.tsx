import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../../utils/network/getAlgoClientConfigs'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [receiverAddress, setReceiverAddress] = useState<string>('')

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const { enqueueSnackbar } = useSnackbar()

  const { transactionSigner, activeAddress } = useWallet()

  const handleSubmitAlgo = async () => {
    setLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      return
    }

    try {
      // TODO remove hardcoded receiver:
      enqueueSnackbar('Sending transaction...', { variant: 'info' })
      const result = await algorand.send.payment({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: 'GPFOAZCTDODG4M4S5XGPLRQHLDMS7OHJS7RA6HABAEY73ME4GTMUK4YUCY',
        amount: algo(0.1),
      })
      enqueueSnackbar(`Transaction sent: ${result.txIds[0]}`, { variant: 'success' })
      setReceiverAddress('')
    } catch (e) {
      enqueueSnackbar('Failed to send transaction', { variant: 'error' })
    }

    setLoading(false)
  }

  if (!openModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-orange-100 rounded-xl shadow-xl flex flex-col items-center">
        <div className="modal-action flex gap-2 m-0 p-4">
          <button className="btn bg-gray-300" onClick={() => setModalState(!openModal)}>
            Close
          </button>
          <button
            data-test-id="send-algo"
            className="btn text-white font-bold bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 border-0 hover:brightness-110"
            onClick={handleSubmitAlgo}
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner" /> : 'Vote for the sunset'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Transact
