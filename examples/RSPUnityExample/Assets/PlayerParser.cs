using extOSC;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerParser : MonoBehaviour
{
		public string Address = "/player";

		public OSCReceiver Receiver;
	public BoidController controller;

		#region Unity Methods

		protected virtual void Start()
		{
			if(!Application.isEditor)
			{
				Cursor.visible = false;
			}
		
			Receiver.Bind(Address, ReceivedMessage);
		}

		protected virtual void Update()
		{
			if(Input.GetKeyUp(KeyCode.Escape))
			{
				Application.Quit();
			}
		}

		#endregion

	#region Private Methods

	private void ReceivedMessage(OSCMessage message)
		{
		int i = 0;
		int pid = message.Values[i++].IntValue;
		BoidBehaviour boid = controller.Get(pid);
		if (boid == null)
        {
			boid = controller.Spawn().GetComponent<BoidBehaviour>();
        }
		PlayerData player = boid.player;
		player.id = pid;
		player.rotationRate.x = message.Values[i++].FloatValue;
		player.rotationRate.y = message.Values[i++].FloatValue;
		player.rotationRate.z = message.Values[i++].FloatValue;
		player.acceleration.x = message.Values[i++].FloatValue;
		player.acceleration.y = message.Values[i++].FloatValue;
		player.acceleration.z = message.Values[i++].FloatValue;
		player.orientation.y = message.Values[i++].FloatValue *-1.0f;
		player.orientation.x = message.Values[i++].FloatValue * -1.0f;
		player.orientation.z = message.Values[i++].FloatValue * -1.0f;
		player.tapCount = message.Values[i++].FloatValue;
		player.tapRate = message.Values[i++].FloatValue;
		player.zone = message.Values[i++].FloatValue;
		player.updatedAt = Time.time;
		}
    #endregion
}
